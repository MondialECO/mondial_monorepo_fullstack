namespace WebApp.DbContext
{
    public class MongoDbSettings
    {
        public string ConnectionString { get; set; }
        public string DatabaseName { get; set; }
        //Connection pool settings
        //public int ServerSelectionTimeoutSeconds { get; init; } = 10;
        //public int ConnectTimeoutSeconds { get; init; } = 10;
        //public int SocketTimeoutSeconds { get; init; } = 30;
        //public int MaxConnectionPoolSize { get; init; } = 100;
        //public int MinConnectionPoolSize { get; init; } = 0;
        //public int WaitQueueTimeoutSeconds { get; init; } = 10;
    }
}
