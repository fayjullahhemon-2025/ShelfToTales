package com.example.shelftotales.shared.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    MockMvc mvc;

    @Test
    void chat_isPublic() throws Exception {
        mvc.perform(post("/api/ai/chat")
                        .contentType("application/json")
                        .content("{\"message\":\"hi\"}"))
                .andExpect(status().is(org.hamcrest.Matchers.not(401)));
    }

    @Test
    void searchImage_isPublic() throws Exception {
        mvc.perform(post("/api/search/image"))
                .andExpect(status().is(org.hamcrest.Matchers.not(401)));
    }
}
