using System.ComponentModel.DataAnnotations;

namespace LiveSentiment.Models
{
    public class CreatePresentationRequest
    {
        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        public Guid? LabelId { get; set; } // Optional label assignment
    }

    public class UpdatePresentationRequest
    {
        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        public Guid? LabelId { get; set; } // Optional label assignment
    }

    // New response models that include label information
    public class PresentationResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LastUpdated { get; set; }
        public Guid? LabelId { get; set; }
        public LabelInfo? Label { get; set; }
    }

    public class LabelInfo
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }
        public bool IsActive { get; set; }
    }

    // Label CRUD Models
    public class CreateLabelRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }
        
        [MaxLength(7)]
        public string Color { get; set; } = "#3B82F6"; // Default blue color
    }

    public class UpdateLabelRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }
        
        [MaxLength(7)]
        public string Color { get; set; }
        
        public bool IsActive { get; set; }
    }

    public class LabelResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LastUpdated { get; set; }
        public bool IsActive { get; set; }
        public int PresentationCount { get; set; }
    }

    public class LabelWithPresentationsResponse : LabelResponse
    {
        public List<PresentationSummary> Presentations { get; set; } = new();
    }

    public class PresentationSummary
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    // Question-related models for presentations
    public class PresentationWithQuestionsResponse : PresentationResponse
    {
        public List<QuestionSummary> Questions { get; set; } = new();
    }
} 