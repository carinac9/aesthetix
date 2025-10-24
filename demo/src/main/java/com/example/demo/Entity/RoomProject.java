package com.example.demo.Entity;

import java.util.List;
import java.util.Map;

import org.hibernate.annotations.Type;

import com.vladmihalcea.hibernate.type.json.JsonType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

@Entity
public class RoomProject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer userId;
    private String name;

    @Column(columnDefinition = "jsonb")
    @Type(JsonType.class)
    private List<Map<String, Object>> polygon;

    @Column(columnDefinition = "jsonb")
    @Type(JsonType.class)
    private Map<String, Object> dimensions;

    @Column(columnDefinition = "jsonb")
    @Type(JsonType.class)
    private Map<String, Object> colors;

    @Column(columnDefinition = "jsonb")
    @Type(JsonType.class)
    private Map<String, Object> lighting;

    @Column(columnDefinition = "jsonb")
    @Type(JsonType.class)
    private List<Map<String, Object>> furniture;

    private Boolean showCeiling = true;

    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;

    public RoomProject() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = java.time.LocalDateTime.now();
        this.updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = java.time.LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<Map<String, Object>> getPolygon() { return polygon; }
    public void setPolygon(List<Map<String, Object>> polygon) { this.polygon = polygon; }
    public Map<String, Object> getDimensions() { return dimensions; }
    public void setDimensions(Map<String, Object> dimensions) { this.dimensions = dimensions; }
    public Map<String, Object> getColors() { return colors; }
    public void setColors(Map<String, Object> colors) { this.colors = colors; }
    public Map<String, Object> getLighting() { return lighting; }
    public void setLighting(Map<String, Object> lighting) { this.lighting = lighting; }
    public List<Map<String, Object>> getFurniture() { return furniture; }
    public void setFurniture(List<Map<String, Object>> furniture) { this.furniture = furniture; }
    public Boolean getShowCeiling() { return showCeiling; }
    public void setShowCeiling(Boolean showCeiling) { this.showCeiling = showCeiling; }
    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
    public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(java.time.LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
