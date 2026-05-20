using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WebApp.Models.DatabaseModels
{
    public class ContactModel
    {
        public string Id { get; set; }

        public string Contact_Message { get; set; }
        public string Emergency_Hotline { get; set; }

        public string General_Phone { get; set; }
        public string General_Email { get; set; }

        public string Sales_Phone { get; set; }
        public string Sales_Email { get; set; }

        public string Address { get; set; }
        public string MapLink { get; set; }

        public string Facebook_link { get; set; }
        public string Linkdin_Link { get; set; }
        public string Youtube_link { get; set; }
        public string Whatsapp_link { get; set; }
        public string Instragram_link { get; set; }
        public string Tiktok_link { get; set; }
        public string X_link { get; set; }
    }
}
