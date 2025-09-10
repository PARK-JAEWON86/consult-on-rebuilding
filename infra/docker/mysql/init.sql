-- MySQL 초기화 스크립트
-- app 사용자가 올바르게 생성되고 모든 필요한 권한을 갖도록 보장

-- 기존 사용자가 있다면 삭제 (에러 무시)
DROP USER IF EXISTS 'app'@'%';
DROP USER IF EXISTS 'app'@'localhost';

-- app 사용자 생성
CREATE USER 'app'@'%' IDENTIFIED BY 'Qkrthgh0617';
CREATE USER 'app'@'localhost' IDENTIFIED BY 'Qkrthgh0617';

-- 데이터베이스 존재 확인 및 생성
CREATE DATABASE IF NOT EXISTS consulton;

-- app 사용자에게 광범위한 권한 부여 (shadow database 생성을 위해)
-- 1. consulton 데이터베이스에 대한 모든 권한
GRANT ALL PRIVILEGES ON consulton.* TO 'app'@'%';
GRANT ALL PRIVILEGES ON consulton.* TO 'app'@'localhost';

-- 2. shadow database 생성을 위한 글로벌 권한
GRANT CREATE ON *.* TO 'app'@'%';
GRANT CREATE ON *.* TO 'app'@'localhost';
GRANT DROP ON *.* TO 'app'@'%';
GRANT DROP ON *.* TO 'app'@'localhost';

-- 3. Prisma가 필요로 하는 추가 권한들
GRANT ALTER ON *.* TO 'app'@'%';
GRANT ALTER ON *.* TO 'app'@'localhost';
GRANT INDEX ON *.* TO 'app'@'%';
GRANT INDEX ON *.* TO 'app'@'localhost';
GRANT REFERENCES ON *.* TO 'app'@'%';
GRANT REFERENCES ON *.* TO 'app'@'localhost';

-- 권한 적용
FLUSH PRIVILEGES;

-- 권한 확인
SHOW GRANTS FOR 'app'@'%';

SELECT 'MySQL initialization completed successfully' as message;