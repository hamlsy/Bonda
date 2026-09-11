package com.bonda;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CoreApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listsDemoBondsAndReturnsBondDetail() throws Exception {
        mockMvc.perform(get("/api/bonds"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].name").value("[데모] 한결산업 1회 회사채"))
            .andExpect(jsonPath("$[0].issuer.name").value("[데모] 한결산업"));

        mockMvc.perform(get("/api/bonds/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.isin").value("DEMO-ISIN-001"));
    }

    @Test
    void createsListsAndDeletesHolding() throws Exception {
        mockMvc.perform(post("/api/holdings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "bondId": 1,
                      "purchaseDate": "2026-01-15",
                      "purchaseAmount": "1000000.00"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/api/holdings/1"))
            .andExpect(jsonPath("$.bond.id").value(1))
            .andExpect(jsonPath("$.purchaseAmount").value(1000000.00));

        mockMvc.perform(get("/api/holdings"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(delete("/api/holdings/1"))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/holdings"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void createsListsAndDeletesWatchlistEntry() throws Exception {
        mockMvc.perform(post("/api/watchlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"bondId": 2}
                    """))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/api/watchlist/1"))
            .andExpect(jsonPath("$.bond.id").value(2));

        mockMvc.perform(post("/api/watchlist")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"bondId": 2}
                    """))
            .andExpect(status().isConflict());

        mockMvc.perform(get("/api/watchlist"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(delete("/api/watchlist/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    void rejectsUnknownBondAndInvalidHolding() throws Exception {
        mockMvc.perform(get("/api/bonds/999"))
            .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/holdings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "bondId": 1,
                      "purchaseDate": "2026-01-15",
                      "purchaseAmount": 0
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void manuallyTriggersCollectionWithoutCallingDartForDemoCorpCodes() throws Exception {
        mockMvc.perform(post("/api/admin/disclosures/collect").param("issuerId", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.issuerCount").value(1))
            .andExpect(jsonPath("$.skippedIssuers").value(1))
            .andExpect(jsonPath("$.failures").value(0));
    }
}
