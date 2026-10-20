package com.vtthanh.V.T.Thanh_Home_SpringBoot;

import com.jayway.jsonpath.JsonPath;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.AdminAccount;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Blog;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.BlogCategory;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.BlogChapter;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.BlogStatus;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Project;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.AdminAccountRepository;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.BlogRepository;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import java.util.List;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class ProjectAndBlogIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private BlogRepository blogRepository;

    @Autowired
    private AdminAccountRepository adminAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        blogRepository.deleteAll();
        projectRepository.deleteAll();

        if (!adminAccountRepository.existsByUsername("stage3admin")) {
            adminAccountRepository.save(new AdminAccount("stage3admin", passwordEncoder.encode("SecretPass123!")));
        }
    }

    private MockHttpSession loginAsAdmin() throws Exception {
        String loginBody = "{\"username\":\"stage3admin\",\"password\":\"SecretPass123!\"}";
        MvcResult loginResult = mockMvc.perform(post("/api/v1/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) loginResult.getRequest().getSession();
    }

    @Test
    void publicProjectsOnlyReturnPublished() throws Exception {
        Project published = new Project("pub-proj", "Published Project", "A public showcase project");
        published.setPublished(true);
        published.setTechStack(List.of("Spring Boot", "Angular"));
        projectRepository.save(published);

        Project draft = new Project("draft-proj", "Draft Project", "A private draft project");
        draft.setPublished(false);
        projectRepository.save(draft);

        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.slug == 'pub-proj')]").exists())
                .andExpect(jsonPath("$[?(@.slug == 'draft-proj')]").doesNotExist());

        mockMvc.perform(get("/api/v1/projects/pub-proj"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Published Project"));

        mockMvc.perform(get("/api/v1/projects/draft-proj"))
                .andExpect(status().isNotFound());
    }

    @Test
    void publicBlogsOnlyReturnPublishedWithChapters() throws Exception {
        Blog pubBlog = new Blog("pub-blog", "Published Blog", "Public summary", BlogCategory.TECHNICAL);
        pubBlog.setStatus(BlogStatus.PUBLISHED);
        pubBlog.addChapter(new BlogChapter(pubBlog, "Chapter 1", "Markdown content", 1));
        blogRepository.save(pubBlog);

        Blog draftBlog = new Blog("draft-blog", "Draft Blog", "Draft summary", BlogCategory.PERSONAL_STORY);
        draftBlog.setStatus(BlogStatus.DRAFT);
        blogRepository.save(draftBlog);

        mockMvc.perform(get("/api/v1/blogs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.slug == 'pub-blog')]").exists())
                .andExpect(jsonPath("$[?(@.slug == 'draft-blog')]").doesNotExist());

        mockMvc.perform(get("/api/v1/blogs/pub-blog"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Published Blog"))
                .andExpect(jsonPath("$.chapters[0].title").value("Chapter 1"));

        mockMvc.perform(get("/api/v1/blogs/draft-blog"))
                .andExpect(status().isNotFound());
    }

    @Test
    void adminProjectLifecycle() throws Exception {
        MockHttpSession session = loginAsAdmin();

        String createJson = "{\"slug\":\"admin-proj\",\"title\":\"Admin Created\",\"description\":\"Desc\",\"techStack\":[\"Java\"],\"published\":true}";
        MvcResult createResult = mockMvc.perform(post("/api/v1/admin/projects")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("admin-proj"))
                .andReturn();

        Long id = ((Number) JsonPath.read(createResult.getResponse().getContentAsString(), "$.id")).longValue();
        Long version = ((Number) JsonPath.read(createResult.getResponse().getContentAsString(), "$.version")).longValue();

        String conflictJson = "{\"slug\":\"admin-proj\",\"title\":\"Conflict\",\"description\":\"Desc\",\"published\":true,\"version\":" + (version + 99) + "}";
        mockMvc.perform(put("/api/v1/admin/projects/" + id)
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(conflictJson))
                .andExpect(status().isConflict());

        String updateJson = "{\"slug\":\"admin-proj\",\"title\":\"Admin Updated\",\"description\":\"Desc\",\"published\":true,\"version\":" + version + "}";
        mockMvc.perform(put("/api/v1/admin/projects/" + id)
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Admin Updated"));

        mockMvc.perform(delete("/api/v1/admin/projects/" + id)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/admin/projects/" + id).session(session))
                .andExpect(status().isNotFound());
    }

    @Test
    void adminBlogLifecycle() throws Exception {
        MockHttpSession session = loginAsAdmin();

        String createJson = "{\"slug\":\"admin-blog\",\"title\":\"Admin Blog Title\",\"description\":\"Summary text\",\"category\":\"TECHNICAL\",\"status\":\"DRAFT\",\"chapters\":[{\"title\":\"Ch 1\",\"content\":\"# Content 1\",\"chapterOrder\":1}]}";
        MvcResult createResult = mockMvc.perform(post("/api/v1/admin/blogs")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("admin-blog"))
                .andExpect(jsonPath("$.chapters[0].title").value("Ch 1"))
                .andReturn();

        Long id = ((Number) JsonPath.read(createResult.getResponse().getContentAsString(), "$.id")).longValue();
        Long version = ((Number) JsonPath.read(createResult.getResponse().getContentAsString(), "$.version")).longValue();

        String conflictJson = "{\"slug\":\"admin-blog\",\"title\":\"Conflict Blog\",\"description\":\"Updated summary\",\"category\":\"TECHNICAL\",\"status\":\"PUBLISHED\",\"version\":" + (version + 99) + "}";
        mockMvc.perform(put("/api/v1/admin/blogs/" + id)
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(conflictJson))
                .andExpect(status().isConflict());

        String updateJson = "{\"slug\":\"admin-blog\",\"title\":\"Updated Blog Title\",\"description\":\"Updated summary\",\"category\":\"TECHNICAL\",\"status\":\"PUBLISHED\",\"version\":" + version + ",\"chapters\":[{\"title\":\"Ch 1 Updated\",\"content\":\"# Updated content\",\"chapterOrder\":1}]}";
        mockMvc.perform(put("/api/v1/admin/blogs/" + id)
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Blog Title"))
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mockMvc.perform(delete("/api/v1/admin/blogs/" + id)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/admin/blogs/" + id).session(session))
                .andExpect(status().isNotFound());
    }

    @Test
    void unauthenticatedAdminAccessReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/projects"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/blogs"))
                .andExpect(status().isUnauthorized());
    }
}
