using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Clarifier
{
    public interface IClarifierTopicService
    {
        Task<TopicEvaluationResult> EvaluateTopicAsync(
            string topic,
            string userText,
            Dictionary<string, TopicStatus> currentStatus,
            string language
        );

        string SelectNextTopic(Dictionary<string, TopicStatus> status);

        Task<string> GenerateFollowUpAsync(
            string topic,
            string userText,
            string language
        );

        bool AllTopicsCleared(Dictionary<string, TopicStatus> status);

        double CalculateClarityScore(Dictionary<string, TopicStatus> status);

        Dictionary<string, TopicStatus> InitializeTopics();

        Task<Dictionary<string, TopicStatus>> GetTopicStatusAsync(string sessionId);

        Task UpdateTopicStatusAsync(string sessionId, Dictionary<string, TopicStatus> status);
    }

    public class ClarifierTopicService : IClarifierTopicService
    {
        private readonly IMongoCollection<ClarifierSession> _sessions;
        private readonly ILogger<ClarifierTopicService> _logger;

        public ClarifierTopicService(
            IMongoClient mongoClient,
            ILogger<ClarifierTopicService> logger
        )
        {
            var database = mongoClient.GetDatabase("MondialEcoDev");
            _sessions = database.GetCollection<ClarifierSession>("ClarifierSessions");
            _logger = logger;
        }

        /// <summary>
        /// Evaluate if a topic is cleared based on user's response
        /// </summary>
        public async Task<TopicEvaluationResult> EvaluateTopicAsync(
            string topic,
            string userText,
            Dictionary<string, TopicStatus> currentStatus,
            string language
        )
        {
            var criteria = GetTopicCriteria(topic);

            // Check if response meets clearing criteria
            var isCleared = EvaluateCriteria(topic, userText, criteria);

            var result = new TopicEvaluationResult
            {
                Topic = topic,
                Status = isCleared ? "clear" : "unclear",
                BaseAnswer = userText,
                RequiresFollowUp = !isCleared,
                Language = language,
                UpdatedAt = DateTime.UtcNow
            };

            _logger.LogInformation($"Topic {topic} evaluation: {result.Status}");

            return result;
        }

        /// <summary>
        /// Select next topic based on priority and current status
        /// Priority: problem → who → solution → alternatives → edge → risk
        /// </summary>
        public string SelectNextTopic(Dictionary<string, TopicStatus> status)
        {
            var topicPriority = new[] { "problem", "who", "solution", "alternatives", "edge", "risk" };

            foreach (var topic in topicPriority)
            {
                if (status.TryGetValue(topic, out var topicStatus))
                {
                    if (topicStatus.Status != "clear")
                    {
                        return topic;
                    }
                }
            }

            // All topics cleared
            return null;
        }

        /// <summary>
        /// Generate follow-up question for unclear topic
        /// Max 1 follow-up per topic per session
        /// </summary>
        public async Task<string> GenerateFollowUpAsync(
            string topic,
            string userText,
            string language
        )
        {
            var followUpPrompt = GetFollowUpPrompt(topic, language);

            // TODO: Call AI to generate follow-up
            // For now, return predefined follow-up
            return GetPredefinedFollowUp(topic, language);
        }

        /// <summary>
        /// Check if all topics are cleared
        /// </summary>
        public bool AllTopicsCleared(Dictionary<string, TopicStatus> status)
        {
            var requiredTopics = new[] { "problem", "who", "solution", "alternatives", "edge", "risk" };

            return requiredTopics.All(t =>
                status.TryGetValue(t, out var s) && s.Status == "clear"
            );
        }

        /// <summary>
        /// Calculate clarity score (0-1) based on topic completion
        /// </summary>
        public double CalculateClarityScore(Dictionary<string, TopicStatus> status)
        {
            var clearedCount = status.Count(s => s.Value.Status == "clear");
            var totalTopics = status.Count;

            if (totalTopics == 0)
                return 0.0;

            var score = (double)clearedCount / totalTopics;
            return Math.Round(score, 2);
        }

        /// <summary>
        /// Initialize topic status dictionary
        /// </summary>
        public Dictionary<string, TopicStatus> InitializeTopics()
        {
            return new Dictionary<string, TopicStatus>
            {
                { "problem", new TopicStatus { Status = "pending", UpdatedAt = DateTime.UtcNow } },
                { "who", new TopicStatus { Status = "pending", UpdatedAt = DateTime.UtcNow } },
                { "solution", new TopicStatus { Status = "pending", UpdatedAt = DateTime.UtcNow } },
                { "alternatives", new TopicStatus { Status = "pending", UpdatedAt = DateTime.UtcNow } },
                { "edge", new TopicStatus { Status = "pending", UpdatedAt = DateTime.UtcNow } },
                { "risk", new TopicStatus { Status = "pending", UpdatedAt = DateTime.UtcNow } }
            };
        }

        /// <summary>
        /// Get current topic status for a session
        /// </summary>
        public async Task<Dictionary<string, TopicStatus>> GetTopicStatusAsync(string sessionId)
        {
            var session = await _sessions.Find(s => s.Id == sessionId).FirstOrDefaultAsync();
            if (session?.Topics == null)
            {
                // Return initialized topics if not set
                return InitializeTopics();
            }

            // Convert BsonDocument to TopicStatus dictionary
            var result = new Dictionary<string, TopicStatus>();
            foreach (var kvp in session.Topics)
            {
                var doc = kvp.Value;
                result[kvp.Key] = new TopicStatus
                {
                    Status = doc.GetValue("Status", "pending").AsString,
                    BaseAnswer = doc.TryGetValue("BaseAnswer", out var ba) ? ba.AsString : null,
                    FollowUpAttempts = doc.TryGetValue("FollowUpAttempts", out var fa) ? fa.AsInt32 : 0,
                    FollowUpText = doc.TryGetValue("FollowUpText", out var ft) ? ft.AsString : null,
                    UpdatedAt = doc.TryGetValue("UpdatedAt", out var ua) ? ua.AsDateTime : DateTime.UtcNow
                };
            }
            return result;
        }

        /// <summary>
        /// Update topic status in session
        /// </summary>
        public async Task UpdateTopicStatusAsync(string sessionId, Dictionary<string, TopicStatus> status)
        {
            var topicsDoc = new Dictionary<string, MongoDB.Bson.BsonDocument>();
            foreach (var kvp in status)
            {
                var baseAnswer = string.IsNullOrEmpty(kvp.Value.BaseAnswer)
                    ? (MongoDB.Bson.BsonValue)MongoDB.Bson.BsonNull.Value
                    : new MongoDB.Bson.BsonString(kvp.Value.BaseAnswer);

                var followUpText = string.IsNullOrEmpty(kvp.Value.FollowUpText)
                    ? (MongoDB.Bson.BsonValue)MongoDB.Bson.BsonNull.Value
                    : new MongoDB.Bson.BsonString(kvp.Value.FollowUpText);

                var doc = new MongoDB.Bson.BsonDocument
                {
                    { "Status", kvp.Value.Status },
                    { "BaseAnswer", baseAnswer },
                    { "FollowUpAttempts", kvp.Value.FollowUpAttempts },
                    { "FollowUpText", followUpText },
                    { "UpdatedAt", kvp.Value.UpdatedAt }
                };
                topicsDoc[kvp.Key] = doc;
            }

            var update = Builders<ClarifierSession>.Update
                .Set(s => s.Topics, topicsDoc)
                .Set(s => s.UpdatedAt, DateTime.UtcNow);

            await _sessions.UpdateOneAsync(s => s.Id == sessionId, update);
        }

        // ============ Helper Methods ============

        private TopicCriteria GetTopicCriteria(string topic)
        {
            return topic switch
            {
                "problem" => new TopicCriteria
                {
                    Name = "The Problem",
                    RequiredElements = new[] { "specific problem", "why it matters" }
                },
                "who" => new TopicCriteria
                {
                    Name = "Who Has It",
                    RequiredElements = new[] { "specific audience", "not generic" }
                },
                "solution" => new TopicCriteria
                {
                    Name = "Your Solution",
                    RequiredElements = new[] { "what to build", "how they use it" }
                },
                "alternatives" => new TopicCriteria
                {
                    Name = "What They Use Now",
                    RequiredElements = new[] { "current solution or name", "why insufficient" }
                },
                "edge" => new TopicCriteria
                {
                    Name = "Your Edge",
                    RequiredElements = new[] { "differentiation or advantage" }
                },
                "risk" => new TopicCriteria
                {
                    Name = "Why Now + Risk",
                    RequiredElements = new[] { "timing reason", "biggest risk" }
                },
                _ => throw new ArgumentException($"Unknown topic: {topic}")
            };
        }

        private bool EvaluateCriteria(string topic, string userText, TopicCriteria criteria)
        {
            if (string.IsNullOrWhiteSpace(userText))
                return false;

            var lowerText = userText.ToLower();

            // Basic evaluation: check if response has enough substance
            // In production, this would call AI to properly evaluate
            return topic switch
            {
                "problem" => lowerText.Length > 20 && !IsGenericAnswer(lowerText),
                "who" => lowerText.Length > 15 && !IsGenericAudience(lowerText),
                "solution" => lowerText.Length > 20,
                "alternatives" => lowerText.Length > 15 || lowerText.Contains("nothing") || lowerText.Contains("no one"),
                "edge" => lowerText.Length > 15,
                "risk" => lowerText.Length > 20,
                _ => false
            };
        }

        private bool IsGenericAnswer(string text)
        {
            var genericPhrases = new[] { "an app", "a website", "something", "an idea", "stuff" };
            return genericPhrases.Any(phrase => text.Contains(phrase) && text.Length < 30);
        }

        private bool IsGenericAudience(string text)
        {
            var genericAudiences = new[] { "everyone", "people", "everyone" };
            return genericAudiences.Any(aud => text == aud);
        }

        private string GetFollowUpPrompt(string topic, string language)
        {
            // Prompts for AI to generate follow-up questions
            return topic switch
            {
                "problem" => language == "fr"
                    ? "Pourquoi cette situation est-elle difficile pour eux?"
                    : "Why is this situation difficult for them?",
                "who" => language == "fr"
                    ? "Quels clients spécifiquement?"
                    : "Which customers specifically?",
                "solution" => language == "fr"
                    ? "Comment quelqu'un l'utiliserait-il?"
                    : "How would someone use it?",
                "alternatives" => language == "fr"
                    ? "Qu'est-ce qui ne va pas avec cette option?"
                    : "What's bad about that option?",
                "edge" => language == "fr"
                    ? "Avez-vous vécu ce problème?"
                    : "Have you lived this problem?",
                "risk" => language == "fr"
                    ? "Pourquoi maintenant et quel est le risque?"
                    : "Why now and what's the biggest risk?",
                _ => ""
            };
        }

        private string GetPredefinedFollowUp(string topic, string language)
        {
            return topic switch
            {
                "problem" => language == "fr"
                    ? "Pourquoi cette situation est-elle difficile pour eux?"
                    : "Why is this situation difficult for them?",
                "who" => language == "fr"
                    ? "Quels étudiants exactement?"
                    : "Which customers exactly?",
                "solution" => language == "fr"
                    ? "Comment quelqu'un l'utiliserait-il? Une application, un site web, un service?"
                    : "How would someone use it? An app, website, or service?",
                "alternatives" => language == "fr"
                    ? "Pourquoi cette option ne suffit pas?"
                    : "What's bad about that option?",
                "edge" => language == "fr"
                    ? "Avez-vous vécu ce problème vous-même?"
                    : "Have you lived this problem yourself?",
                "risk" => language == "fr"
                    ? "Quelle est la plus grande chose qui pourrait mal tourner?"
                    : "What's the one thing that could go wrong?",
                _ => ""
            };
        }
    }

    // ============ Supporting Classes ============

    public class TopicEvaluationResult
    {
        public string Topic { get; set; }
        public string Status { get; set; }  // pending/unclear/clear
        public string BaseAnswer { get; set; }
        public bool RequiresFollowUp { get; set; }
        public string Language { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class TopicCriteria
    {
        public string Name { get; set; }
        public string[] RequiredElements { get; set; }
    }

    public class TopicStatus
    {
        public string Status { get; set; } = "pending";  // pending/unclear/clear
        public string BaseAnswer { get; set; }
        public int FollowUpAttempts { get; set; } = 0;
        public string FollowUpText { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
