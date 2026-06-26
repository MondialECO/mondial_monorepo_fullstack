using System.Text.Json;
using System.Text.Json.Serialization;
using MongoDB.Bson;

namespace WebApp.Serialization
{
    /// <summary>
    /// Serializes a MongoDB <see cref="ObjectId"/> as its canonical 24-character
    /// hex string (and parses it back), instead of System.Text.Json's default of
    /// emitting the struct's component fields (timestamp/machine/pid/increment) as
    /// a JSON object.
    ///
    /// Applied per-property to the Notification entity's id fields so the wire
    /// payload matches the documented frontend contract ("ids are opaque strings")
    /// and so POST /api/notification/read/{id} receives a parseable 24-hex id
    /// instead of "[object Object]" (which threw FormatException -> 500).
    ///
    /// Scope: only affects JSON (HTTP + SignalR) serialization of the annotated
    /// properties. Mongo/Bson storage is unchanged (still a native ObjectId via
    /// [BsonId]).
    /// </summary>
    public sealed class ObjectIdJsonConverter : JsonConverter<ObjectId>
    {
        public override ObjectId Read(
            ref Utf8JsonReader reader,
            Type typeToConvert,
            JsonSerializerOptions options)
        {
            var value = reader.GetString();
            return ObjectId.TryParse(value, out var id) ? id : ObjectId.Empty;
        }

        public override void Write(
            Utf8JsonWriter writer,
            ObjectId value,
            JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString());
        }
    }
}
