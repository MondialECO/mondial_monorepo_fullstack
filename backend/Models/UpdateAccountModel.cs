using WebApp.Models.DatabaseModels;

namespace WebApp.Models
{
    public class UpdateAccountModel
    {
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Bio { get; set; }
        public Address Address { get; set; }
    }
}
