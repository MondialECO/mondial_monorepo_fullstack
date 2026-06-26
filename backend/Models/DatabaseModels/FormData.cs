namespace WebApp.Models.DatabaseModels
{
    public class FormData
    {
        
        public Guid Id { get; set; }
        public string Prenom { get; set; }
        public string Email { get; set; }
        public string Pays { get; set; }
        public string TypeProjet { get; set; }
        public string idee { get; set; }
        public string pourquoi { get; set; }
        public string peur { get; set; }
        public string temps { get; set; }
        public string budget { get; set; }
        public bool conditions { get; set; }

    }
}
