package com.vtthanh.V.T.Thanh_Home_SpringBoot.repository;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ChatMessage;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.time.Instant;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Modifying
    @Query("update ChatMessage m set m.status = 'FAILED' where m.status = 'PROCESSING' and m.createdDate < :cutoff")
    int expireProcessing(@Param("cutoff") Instant cutoff);

    Optional<ChatMessage> findByChatSessionAndRequestId(ChatSession session, String requestId);

    List<ChatMessage> findTop3ByChatSessionAndStatusOrderByCreatedDateDesc(ChatSession session, String status);

    List<ChatMessage> findTop50ByChatSessionAndStatusOrderByCreatedDateDesc(ChatSession session, String status);

    long countByChatSession(ChatSession session);

    List<ChatMessage> findTop3ByChatSessionOrderByCreatedDateDesc(ChatSession chatSession);

    List<ChatMessage> findByChatSessionOrderByCreatedDateAsc(ChatSession chatSession);
}
