package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ProjectResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ProjectUpsertRequest;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Project;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ResourceNotFoundException;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.ProjectRepository;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getPublicProjects() {
        return projectRepository.findByPublishedTrueOrderByDisplayOrderAscIdAsc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getPublicProjectBySlug(String slug) {
        return projectRepository.findBySlugAndPublishedTrue(slug)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with slug: " + slug));
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjectsForAdmin() {
        return projectRepository.findAllByOrderByDisplayOrderAscIdAsc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectByIdForAdmin(Long id) {
        return projectRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    @Transactional
    public ProjectResponse createProject(ProjectUpsertRequest req) {
        if (req.title() == null || req.title().isBlank()) {
            throw new IllegalArgumentException("Project title is required");
        }
        if (req.slug() == null || req.slug().isBlank()) {
            throw new IllegalArgumentException("Project slug is required");
        }
        if (projectRepository.existsBySlug(req.slug())) {
            throw new IllegalArgumentException("Project slug already exists: " + req.slug());
        }

        Project project = new Project(req.slug(), req.title(), req.description() != null ? req.description() : "");
        project.setLabel(req.label());
        project.setSubtitle(req.subtitle());
        project.setGithubLink(req.githubLink());
        project.setWebsiteLink(req.websiteLink());
        project.setDisplayOrder(req.displayOrder() != null ? req.displayOrder() : 0);
        project.setPublished(req.published() != null ? req.published() : true);
        project.setTechStack(req.techStack());

        Project saved = projectRepository.save(project);
        return mapToResponse(saved);
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectUpsertRequest req) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (req.version() != null && !req.version().equals(project.getVersion())) {
            throw new OptimisticLockingFailureException("Version conflict for project id: " + id);
        }

        if (req.slug() != null && !req.slug().equals(project.getSlug())) {
            if (projectRepository.existsBySlug(req.slug())) {
                throw new IllegalArgumentException("Project slug already exists: " + req.slug());
            }
            project.setSlug(req.slug());
        }

        if (req.title() != null) {
            project.setTitle(req.title());
        }
        if (req.label() != null) {
            project.setLabel(req.label());
        }
        if (req.subtitle() != null) {
            project.setSubtitle(req.subtitle());
        }
        if (req.description() != null) {
            project.setDescription(req.description());
        }
        if (req.githubLink() != null) {
            project.setGithubLink(req.githubLink());
        }
        if (req.websiteLink() != null) {
            project.setWebsiteLink(req.websiteLink());
        }
        if (req.displayOrder() != null) {
            project.setDisplayOrder(req.displayOrder());
        }
        if (req.published() != null) {
            project.setPublished(req.published());
        }
        if (req.techStack() != null) {
            project.setTechStack(req.techStack());
        }

        Project saved = projectRepository.save(project);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found with id: " + id);
        }
        projectRepository.deleteById(id);
    }

    private ProjectResponse mapToResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getSlug(),
                project.getLabel(),
                project.getTitle(),
                project.getSubtitle(),
                project.getDescription(),
                project.getTechStack(),
                project.getGithubLink(),
                project.getWebsiteLink(),
                project.getDisplayOrder(),
                project.isPublished(),
                project.getVersion(),
                project.getCreatedDate(),
                project.getUpdatedDate()
        );
    }
}
