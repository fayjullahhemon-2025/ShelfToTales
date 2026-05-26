package com.example.shelftotales.social.domain;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Entity
@Table(name = "reaction_counts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@IdClass(ReactionCount.ReactionCountId.class)
public class ReactionCount {

    @Id @Column(name = "target_type", length = 30)
    private String targetType;

    @Id @Column(name = "target_id")
    private Long targetId;

    @Id @Column(name = "reaction_type", length = 20)
    private String reactionType;

    @Column(nullable = false)
    @Builder.Default
    private int count = 0;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
    public static class ReactionCountId implements Serializable {
        private String targetType;
        private Long targetId;
        private String reactionType;
    }
}
