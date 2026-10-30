using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace WebApp.Services.Clarifier
{
    public interface IClarifierTurnService
    {
        IAsyncEnumerable<string> StreamAiResponseAsync(
            string userMessage,
            string language,
            string sessionId,
            string currentTopic,
            CancellationToken cancellationToken = default
        );
    }

    public class ClarifierTurnService : IClarifierTurnService
    {
        private readonly ILogger<ClarifierTurnService> _logger;

        public ClarifierTurnService(
            ILogger<ClarifierTurnService> logger
        )
        {
            _logger = logger;
        }

        /// <summary>
        /// Stream AI response for clarifier topic evaluation
        /// </summary>
        public async IAsyncEnumerable<string> StreamAiResponseAsync(
            string userMessage,
            string language,
            string sessionId,
            string currentTopic,
            [System.Runtime.CompilerServices.EnumeratorCancellation]
            CancellationToken cancellationToken = default
        )
        {
            _logger.LogInformation($"[Clarifier] Evaluating topic {currentTopic} for session {sessionId}");

            // Stream response chunks with simulated typing effect
            var response = GenerateTopicResponse(currentTopic, userMessage, language);
            var words = response.Split(' ');

            foreach (var word in words)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                yield return word + " ";
                await Task.Delay(50, cancellationToken); // Simulate streaming delay
            }
        }

        private string GenerateTopicResponse(string topic, string userMessage, string language)
        {
            // Placeholder: In production, this would call the AI service
            return topic switch
            {
                "problem" => language == "fr"
                    ? "Votre description du problème est claire. Pouvez-vous préciser pourquoi c'est un problème urgent?"
                    : "Your problem statement is clear. Can you explain why this is an urgent issue?",

                "who" => language == "fr"
                    ? "Vous avez identifié une audience. Est-elle assez spécifique et définie?"
                    : "You've identified an audience. Is it specific enough?",

                "solution" => language == "fr"
                    ? "Votre solution est intéressante. Comment les utilisateurs l'utiliseraient-ils exactement?"
                    : "Your solution is interesting. How would users interact with it?",

                "alternatives" => language == "fr"
                    ? "Vous avez mentionné les alternatives. Qu'est-ce qui ne va pas avec elles?"
                    : "You mentioned alternatives. What's insufficient about them?",

                "edge" => language == "fr"
                    ? "Vous avez un avantage. Est-il vraiment durable et protégé?"
                    : "You have an edge. Is it truly sustainable?",

                "risk" => language == "fr"
                    ? "Vous avez identifié les risques. Quel est le plus grand risque?"
                    : "You identified risks. What's the biggest risk?",

                _ => language == "fr"
                    ? "Merci pour cette réponse."
                    : "Thank you for that response."
            };
        }
    }
}
