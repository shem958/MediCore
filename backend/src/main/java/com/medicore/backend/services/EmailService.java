package com.medicore.backend.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Async
    public void sendEmail(String to, String subject, String body) {
        // Mock email sending by printing to console beautifully
        logger.info("\n==========================================");
        logger.info("📧 MOCK EMAIL SENDING 📧");
        logger.info("==========================================");
        logger.info("TO: {}", to);
        logger.info("SUBJECT: {}", subject);
        logger.info("BODY:");
        logger.info("{}", body);
        logger.info("==========================================\n");
    }
}
