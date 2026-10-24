package com.vtthanh.V.T.Thanh_Home_SpringBoot.repository;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ChatMessage;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ChatSession;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ChatHistoryItemResponse;
import org.springframework.data.domain.Pageable;
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

    @Query("select new com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ChatHistoryItemResponse(m.id, m.input, m.output, m.createdDate) from ChatMessage m where m.chatSession = :session and m.status = :status order by m.createdDate desc, m.id desc")
    List<ChatHistoryItemResponse> findHistoryByChatSessionAndStatus(
            @Param("session") ChatSession session, @Param("status") String status, Pageable page);

    long countByChatSession(ChatSession session);

    List<ChatMessage> findTop3ByChatSessionOrderByCreatedDateDesc(ChatSession chatSession);

    List<ChatMessage> findByChatSessionOrderByCreatedDateAsc(ChatSession chatSession);
}
