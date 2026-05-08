-- Create churn prediction tables
-- Migration: 20260507000000_churn_tables

-- Tabela de previsões
CREATE TABLE IF NOT EXISTS churn_predictions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  unidade_id INT NOT NULL,
  score_risco TINYINT UNSIGNED NOT NULL,
  probabilidade FLOAT NOT NULL,
  features JSON,
  previsao_data DATETIME NOT NULL,
  proxima_visita_prevista DATE,
  status ENUM('ativo', 'em_risco', 'em_risco_alto', 'perdido'),
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cliente (cliente_id),
  INDEX idx_previsao (previsao_data),
  INDEX idx_status (status),
  INDEX idx_unidade (unidade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de ações
CREATE TABLE IF NOT EXISTS churn_acoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  unidade_id INT NOT NULL,
  tipo_acao ENUM('email', 'sms', 'whatsapp', 'desconto', 'alerta') NOT NULL,
  mensagem TEXT,
  status ENUM('pendente', 'enviado', 'falhou', 'ignorado', 'respondeu') DEFAULT 'pendente',
  data_acao DATETIME,
  response_data JSON,
  created_at DATETIME DEFAULT NOW(),
  INDEX idx_cliente (cliente_id),
  INDEX idx_status (status),
  INDEX idx_data (data_acao),
  INDEX idx_unidade (unidade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de logs
CREATE TABLE IF NOT EXISTS churn_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo_processamento ENUM('diario', 'manual', 'agendado') NOT NULL,
  registros_analisados INT,
  previsoes_geradas INT,
  acoes_disparadas INT,
  status ENUM('success', 'error'),
  erro_mensagem TEXT,
  duration_ms INT,
  created_at DATETIME DEFAULT NOW(),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configuração de ações
CREATE TABLE IF NOT EXISTS churn_acoes_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unidade_id INT,
  tipo_acao ENUM('email', 'sms', 'whatsapp', 'desconto', 'alerta'),
  ativo BOOLEAN DEFAULT TRUE,
  mensagem_template TEXT,
  score_min INT DEFAULT 0,
  score_max INT DEFAULT 100,
  criado_em DATETIME DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
