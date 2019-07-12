-- MySQL dump 10.13  Distrib 5.7.22, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: happygame
-- ------------------------------------------------------
-- Server version	5.7.22-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `t_rooms`
--

DROP TABLE IF EXISTS `t_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `t_rooms` (
  `uuid` char(20) NOT NULL,
  `roomId` char(8) NOT NULL,
  `base_info` varchar(256) NOT NULL DEFAULT '0' COMMENT '房间基本配置',
  `ip` varchar(16) DEFAULT NULL,
  `port` int(11) DEFAULT '0',
  `create_time` int(11) NOT NULL DEFAULT '0',
  `usersInfo` varchar(1024) DEFAULT NULL,
  `num_of_turns` tinyint(16) DEFAULT '0',
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `id` (`roomId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_rooms`
--

LOCK TABLES `t_rooms` WRITE;
/*!40000 ALTER TABLE `t_rooms` DISABLE KEYS */;
INSERT INTO `t_rooms` VALUES ('1562383525778124086','124086','{\"type\":\"ddz\",\"baseScore\":1,\"maxGames\":4,\"creator\":244849,\"playerMaxNum\":3,\"rule\":0}','127.0.0.1',10000,1562383526,'{\"244849\":{\"userId\":244849,\"seatIndex\":0,\"name\":\"马晶滢\",\"score\":0},\"407909\":{\"userId\":407909,\"seatIndex\":1,\"name\":\"花凌晶\",\"score\":0},\"617755\":{\"userId\":617755,\"seatIndex\":2,\"name\":\"华佳欣\",\"score\":0}}',1);
/*!40000 ALTER TABLE `t_rooms` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-07-06 15:28:37
