-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: dish_app
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `dish_ing`
--

DROP TABLE IF EXISTS `dish_ing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dish_ing` (
  `dishID` int NOT NULL,
  `ingID` int NOT NULL,
  `qty` decimal(10,2) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`dishID`,`ingID`),
  KEY `ingID` (`ingID`),
  CONSTRAINT `dish_ing_ibfk_1` FOREIGN KEY (`dishID`) REFERENCES `dishes` (`dishID`) ON DELETE CASCADE,
  CONSTRAINT `dish_ing_ibfk_2` FOREIGN KEY (`ingID`) REFERENCES `ing` (`ingID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dish_ing`
--

LOCK TABLES `dish_ing` WRITE;
/*!40000 ALTER TABLE `dish_ing` DISABLE KEYS */;
/*!40000 ALTER TABLE `dish_ing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dishes`
--

DROP TABLE IF EXISTS `dishes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dishes` (
  `dishID` int NOT NULL AUTO_INCREMENT,
  `dishName` varchar(100) NOT NULL,
  `orgID` int DEFAULT NULL,
  PRIMARY KEY (`dishID`),
  KEY `orgID` (`orgID`),
  CONSTRAINT `dishes_ibfk_1` FOREIGN KEY (`orgID`) REFERENCES `orgs` (`orgID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dishes`
--

LOCK TABLES `dishes` WRITE;
/*!40000 ALTER TABLE `dishes` DISABLE KEYS */;
/*!40000 ALTER TABLE `dishes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ing`
--

DROP TABLE IF EXISTS `ing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ing` (
  `ingID` int NOT NULL AUTO_INCREMENT,
  `ingName` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `expiry` date DEFAULT NULL,
  `batchNum` varchar(50) DEFAULT NULL,
  `orgID` int DEFAULT NULL,
  PRIMARY KEY (`ingID`),
  KEY `orgID` (`orgID`),
  CONSTRAINT `ing_ibfk_1` FOREIGN KEY (`orgID`) REFERENCES `orgs` (`orgID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ing`
--

LOCK TABLES `ing` WRITE;
/*!40000 ALTER TABLE `ing` DISABLE KEYS */;
/*!40000 ALTER TABLE `ing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orgs`
--

DROP TABLE IF EXISTS `orgs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orgs` (
  `orgID` int NOT NULL AUTO_INCREMENT,
  `orgName` varchar(100) NOT NULL,
  `latCoord` decimal(10,8) DEFAULT NULL,
  `longCoord` decimal(11,8) DEFAULT NULL,
  `org_email` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`orgID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orgs`
--

LOCK TABLES `orgs` WRITE;
/*!40000 ALTER TABLE `orgs` DISABLE KEYS */;
INSERT INTO `orgs` VALUES (7,'Test',NULL,NULL,'dg53175@uga.edu');
/*!40000 ALTER TABLE `orgs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `userID` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `hashed_pwd` varchar(255) NOT NULL,
  `orgID` int DEFAULT NULL,
  `uRole` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`userID`),
  UNIQUE KEY `username` (`username`),
  KEY `orgID` (`orgID`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`orgID`) REFERENCES `orgs` (`orgID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'test1','scrypt:32768:8:1$olsShng1xF9BEEhN$bfa749b65cd599c836570035f631681bbdd5f938e5b37f6bb82858617e8081cd24ed320062d6c74fdd79319856f7250b55dd49d491dc5b8be1d03deb52dadab0',7,'admin',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-07 14:57:42
