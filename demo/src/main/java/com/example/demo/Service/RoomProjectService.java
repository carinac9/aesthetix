package com.example.demo.Service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.Entity.RoomProject;
import com.example.demo.Repository.RoomProjectRepository;

@Service
public class RoomProjectService {
    private final RoomProjectRepository repo;

    public RoomProjectService(RoomProjectRepository repo) {
        this.repo = repo;
    }

    public RoomProject save(RoomProject project) {
        return repo.save(project);
    }

    public List<RoomProject> getByUserId(Integer userId) {
        return repo.findByUserId(userId);
    }

    public RoomProject getById(Long id) {
        return repo.findById(id).orElse(null);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}
