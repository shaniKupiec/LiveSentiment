using LiveSentiment.Models;
using Microsoft.EntityFrameworkCore;

namespace LiveSentiment.Data
{
    // Main EF Core context for the application
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Presenter> Presenters { get; set; }
        public DbSet<Presentation> Presentations { get; set; }
        public DbSet<Poll> Polls { get; set; }
        public DbSet<Response> Responses { get; set; }
        public DbSet<SentimentAggregate> SentimentAggregates { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure relationships and constraints as per schema
            modelBuilder.Entity<Presenter>().HasKey(p => p.Id);
            modelBuilder.Entity<Presentation>().HasKey(p => p.Id);
            modelBuilder.Entity<Poll>().HasKey(p => p.Id);
            modelBuilder.Entity<Response>().HasKey(r => r.Id);
            modelBuilder.Entity<SentimentAggregate>().HasKey(s => s.PollId);

            modelBuilder.Entity<Presentation>()
                .HasOne(p => p.Presenter)
                .WithMany(pr => pr.Presentations)
                .HasForeignKey(p => p.PresenterId);

            modelBuilder.Entity<Poll>()
                .HasOne(p => p.Presentation)
                .WithMany(pr => pr.Polls)
                .HasForeignKey(p => p.PresentationId);

            modelBuilder.Entity<Response>()
                .HasOne(r => r.Poll)
                .WithMany(p => p.Responses)
                .HasForeignKey(r => r.PollId);

            modelBuilder.Entity<SentimentAggregate>()
                .HasOne(s => s.Poll)
                .WithOne(p => p.SentimentAggregate)
                .HasForeignKey<SentimentAggregate>(s => s.PollId);

            // Configure JSON properties for PostgreSQL
            modelBuilder.Entity<Poll>()
                .Property(p => p.Options)
                .HasColumnType("jsonb");

            modelBuilder.Entity<SentimentAggregate>()
                .Property(s => s.SentimentCounts)
                .HasColumnType("jsonb");

            modelBuilder.Entity<SentimentAggregate>()
                .Property(s => s.EmotionCounts)
                .HasColumnType("jsonb");

            modelBuilder.Entity<SentimentAggregate>()
                .Property(s => s.Keywords)
                .HasColumnType("jsonb");
        }
    }
} 