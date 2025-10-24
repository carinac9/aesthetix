package com.example.demo.Controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.Entity.RoomProject;
import com.example.demo.Service.RoomProjectService;

@RestController
@RequestMapping("/api/room-projects")
public class RoomProjectController {
    private final RoomProjectService service;

    public RoomProjectController(RoomProjectService service) {
        this.service = service;
    }

    @PostMapping
    public RoomProject save(@RequestBody RoomProject project) {
        return service.save(project);
    }

    @GetMapping("/user/{userId}")
    public List<RoomProject> getByUser(@PathVariable Integer userId) {
        return service.getByUserId(userId);
    }

    @GetMapping("/{id}")
    public RoomProject getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PutMapping("/{id}")
    public RoomProject update(@PathVariable Long id, @RequestBody RoomProject project) {
        RoomProject existingProject = service.getById(id);
        if (existingProject == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
        }
        project.setId(id); 
        return service.save(project);
    }
}
