-- Run after schema.sql has created the campus_secondhand database and users table.
USE campus_secondhand;

CREATE TABLE IF NOT EXISTS messages (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id   INT UNSIGNED NOT NULL,
  receiver_id INT UNSIGNED NOT NULL,
  content     VARCHAR(2000) NOT NULL,
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_sender_receiver_id (sender_id, receiver_id, id),
  KEY idx_messages_receiver_sender_id (receiver_id, sender_id, id),
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id),
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='私信消息';

SET @add_is_read_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE messages ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0 AFTER content',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'messages'
    AND column_name = 'is_read'
);
PREPARE add_is_read_statement FROM @add_is_read_column;
EXECUTE add_is_read_statement;
DEALLOCATE PREPARE add_is_read_statement;
