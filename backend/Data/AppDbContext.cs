using LiveSentiment.Models;
using Microsoft.EntityFrameworkCore;

namespace LiveSentiment.Data
{
    // Main EF Core context for the application
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Presenter> Presenters { get; set; }
        public DbSet<Label> Labels { get; set; }
        public DbSet<Presentation> Presentations { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Response> Responses { get; set; }
        public DbSet<SentimentAggregate> SentimentAggregates { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure relationships and constraints as per schema
            modelBuilder.Entity<Presenter>().HasKey(p => p.Id);
            modelBuilder.Entity<Label>().HasKey(l => l.Id);
            modelBuilder.Entity<Presentation>().HasKey(p => p.Id);
            modelBuilder.Entity<Question>().HasKey(q => q.Id);
            modelBuilder.Entity<Response>().HasKey(r => r.Id);
            modelBuilder.Entity<SentimentAggregate>().HasKey(s => s.QuestionId);

            // Label relationships
            modelBuilder.Entity<Label>()
                .HasOne(l => l.Presenter)
                .WithMany(p => p.Labels)
                .HasForeignKey(l => l.PresenterId)
                .OnDelete(DeleteBehavior.Cascade);

            // Presentation relationships
            modelBuilder.Entity<Presentation>()
                .HasOne(p => p.Presenter)
                .WithMany(pr => pr.Presentations)
                .HasForeignKey(p => p.PresenterId);

            modelBuilder.Entity<Presentation>()
                .HasOne(p => p.Label)
                .WithMany(l => l.Presentations)
                .HasForeignKey(p => p.LabelId)
                .OnDelete(DeleteBehavior.SetNull); // If label is deleted, presentation keeps labelId as null


            // Question relationships
            modelBuilder.Entity<Question>()
                .HasOne(q => q.Presentation)
                .WithMany(p => p.Questions)
                .HasForeignKey(q => q.PresentationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Response>()
                .HasOne(r => r.Question)
                .WithMany(q => q.Responses)
                .HasForeignKey(r => r.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SentimentAggregate>()
                .HasOne(s => s.Question)
                .WithOne()
                .HasForeignKey<SentimentAggregate>(s => s.QuestionId);

            // Configure JSON properties for PostgreSQL

            modelBuilder.Entity<Question>()
                .Property(q => q.Configuration)
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