-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 01, 2026 at 02:39 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `postoffice`
--

-- --------------------------------------------------------

--
-- Table structure for table `auditlog`
--

CREATE TABLE `auditlog` (
  `id` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `userEmail` varchar(255) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entityType` varchar(50) DEFAULT NULL,
  `entityId` varchar(255) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ipAddress` varchar(45) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `auditlog`
--

INSERT INTO `auditlog` (`id`, `userId`, `userEmail`, `action`, `entityType`, `entityId`, `details`, `ipAddress`, `timestamp`) VALUES
(1, NULL, 'edrian@gmail.com', 'Created user', 'user', NULL, '{\"role\":\"staff\"}', '127.0.0.1', '2026-03-17 05:02:41'),
(2, NULL, NULL, 'Updated ticket', 'ticket', '136', '{\"status\":\"inprogress\",\"acceptedBy\":\"Swabe Edrian\",\"acceptedAt\":\"2026-03-17T08:01:05.935Z\"}', '127.0.0.1', '2026-03-17 08:01:05'),
(3, NULL, NULL, 'Accepted ticket', 'ticket', '136', '{\"acceptedBy\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-17 08:01:05'),
(4, NULL, NULL, 'Created joborder', 'joborder', '1', '{\"staffId\":1,\"ticketId\":\"136\"}', '127.0.0.1', '2026-03-17 08:01:05'),
(5, NULL, NULL, 'Created notification', 'notification', '1', '{\"ticketId\":\"136\",\"staffId\":1,\"staffName\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-17 08:01:10'),
(6, NULL, NULL, 'Updated joborder', 'joborder', '1', '{\"status\":\"done\"}', '127.0.0.1', '2026-03-17 08:01:10'),
(7, NULL, NULL, 'Updated ticket', 'ticket', '121', '{\"status\":\"inprogress\",\"acceptedBy\":\"Swabe Edrian\",\"acceptedAt\":\"2026-03-17T08:01:41.493Z\"}', '127.0.0.1', '2026-03-17 08:01:41'),
(8, NULL, NULL, 'Accepted ticket', 'ticket', '121', '{\"acceptedBy\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-17 08:01:41'),
(9, NULL, NULL, 'Created joborder', 'joborder', '2', '{\"staffId\":1,\"ticketId\":\"121\"}', '127.0.0.1', '2026-03-17 08:01:41'),
(10, NULL, NULL, 'Deleted branch', 'branch', '13', NULL, '127.0.0.1', '2026-03-23 02:11:03'),
(11, NULL, NULL, 'Deleted branch', 'branch', '14', NULL, '127.0.0.1', '2026-03-23 02:20:56'),
(12, NULL, NULL, 'Created branch', 'branch', '15', '{\"name\":\"test\"}', '127.0.0.1', '2026-03-23 02:20:59'),
(13, NULL, NULL, 'Deleted branch', 'branch', '15', NULL, '127.0.0.1', '2026-03-23 02:21:01'),
(14, NULL, NULL, 'Notification approved', 'notification', '1', '{\"ticketId\":136}', '127.0.0.1', '2026-03-23 02:21:45'),
(15, NULL, 'gutierrezdave61@gmail.com', 'Created ticket', 'ticket', 'T333952', '{\"branch\":\"Caloocan Central Post Office\",\"department\":\"Accounting\",\"problem\":\"test ticket\"}', '127.0.0.1', '2026-03-23 08:42:14'),
(16, NULL, NULL, 'Updated ticket', 'ticket', '159', '{\"status\":\"inprogress\",\"acceptedBy\":\"Sarah Johnson\",\"acceptedAt\":\"2026-03-24T04:30:06.108Z\"}', '127.0.0.1', '2026-03-24 04:30:06'),
(17, NULL, NULL, 'Accepted ticket', 'ticket', '159', '{\"acceptedBy\":\"Sarah Johnson\"}', '127.0.0.1', '2026-03-24 04:30:06'),
(18, NULL, NULL, 'Created joborder', 'joborder', '3', '{\"staffId\":2,\"ticketId\":\"159\"}', '127.0.0.1', '2026-03-24 04:30:06'),
(19, NULL, 'gutierrezdave61@gmail.com', 'Created ticket', 'ticket', 'T542400', '{\"branch\":\"Las Piñas Post Office\",\"department\":\"Marketing\",\"problem\":\"testtesttesttest\"}', '127.0.0.1', '2026-03-24 05:02:22'),
(20, NULL, NULL, 'Updated ticket', 'ticket', '202', '{\"status\":\"inprogress\",\"acceptedBy\":\"Swabe Edrian\",\"acceptedAt\":\"2026-03-24T05:04:02.684Z\"}', '127.0.0.1', '2026-03-24 05:04:02'),
(21, NULL, NULL, 'Accepted ticket', 'ticket', '202', '{\"acceptedBy\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-24 05:04:02'),
(22, NULL, NULL, 'Created joborder', 'joborder', '4', '{\"staffId\":1,\"ticketId\":\"202\"}', '127.0.0.1', '2026-03-24 05:04:02'),
(23, NULL, 'john.doe@example.com', 'Created ticket', 'ticket', 'T126176', '{\"branch\":\"Main\",\"department\":\"IT\",\"problem\":\"Test issue\"}', '127.0.0.1', '2026-03-24 05:28:46'),
(24, NULL, 'john.doe@example.com', 'Created ticket', 'ticket', 'T264459', '{\"branch\":\"Main\",\"department\":\"IT\",\"problem\":\"Test issue\"}', '127.0.0.1', '2026-03-24 05:47:44'),
(25, NULL, 'gutierrezdave61@gmail.com', 'Created ticket', 'ticket', 'T471299', '{\"branch\":\"Quezon City Central Post Office\",\"department\":\"Accounting\",\"problem\":\"sample ticket\"}', '127.0.0.1', '2026-03-24 05:51:11'),
(26, NULL, NULL, 'Updated ticket', 'ticket', '206', '{\"status\":\"inprogress\",\"acceptedBy\":\"Swabe Edrian\",\"acceptedAt\":\"2026-03-24T05:52:34.194Z\"}', '127.0.0.1', '2026-03-24 05:52:34'),
(27, NULL, NULL, 'Accepted ticket', 'ticket', '206', '{\"accepted_by\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-24 05:52:34'),
(28, NULL, NULL, 'Created joborder', 'joborder', '5', '{\"staffId\":1,\"ticketId\":\"206\"}', '127.0.0.1', '2026-03-24 05:52:34'),
(29, NULL, NULL, 'Updated ticket', 'ticket', '204', '{\"status\":\"inprogress\",\"acceptedBy\":\"Swabe Edrian\",\"acceptedAt\":\"2026-03-24T05:52:53.619Z\"}', '127.0.0.1', '2026-03-24 05:52:53'),
(30, NULL, NULL, 'Accepted ticket', 'ticket', '204', '{\"accepted_by\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-24 05:52:53'),
(31, NULL, NULL, 'Created joborder', 'joborder', '6', '{\"staffId\":1,\"ticketId\":\"204\"}', '127.0.0.1', '2026-03-24 05:52:53'),
(32, NULL, NULL, 'Updated ticket', 'ticket', '10', '{\"status\":\"inprogress\",\"acceptedBy\":\"Swabe Edrian\",\"acceptedAt\":\"2026-03-24T05:59:24.103Z\"}', '127.0.0.1', '2026-03-24 05:59:24'),
(33, NULL, NULL, 'Accepted ticket', 'ticket', '10', '{\"accepted_by\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-24 05:59:24'),
(34, NULL, NULL, 'Created joborder', 'joborder', '7', '{\"staffId\":1,\"ticketId\":\"10\"}', '127.0.0.1', '2026-03-24 05:59:24'),
(35, NULL, NULL, 'Updated ticket', 'ticket', '205', '{\"status\":\"inprogress\",\"acceptedBy\":\"Swabe Edrian\",\"acceptedAt\":\"2026-03-25T02:37:19.566Z\"}', '127.0.0.1', '2026-03-25 02:37:19'),
(36, NULL, NULL, 'Accepted ticket', 'ticket', '205', '{\"accepted_by\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-25 02:37:19'),
(37, NULL, NULL, 'Created joborder', 'joborder', '8', '{\"staffId\":1,\"ticketId\":\"205\"}', '127.0.0.1', '2026-03-25 02:37:19'),
(38, NULL, 'gutierrezdave61@gmail.com', 'Created ticket', 'ticket', 'T389400', '{\"branch\":\"Makati Central Post Office\",\"department\":\"Human Resource\",\"problem\":\"2 sample ticket\"}', '127.0.0.1', '2026-03-25 02:39:49'),
(39, NULL, NULL, 'Created notification', 'notification', '2', '{\"ticketId\":\"206\",\"staffId\":1,\"staffName\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-25 02:43:57'),
(40, NULL, NULL, 'Updated joborder', 'joborder', '5', '{\"status\":\"done\"}', '127.0.0.1', '2026-03-25 02:43:57'),
(41, NULL, NULL, 'Notification approved', 'notification', '2', '{\"ticketId\":206}', '127.0.0.1', '2026-03-25 02:44:04'),
(42, NULL, NULL, 'Created notification', 'notification', '3', '{\"ticketId\":\"205\",\"staffId\":1,\"staffName\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-25 02:44:18'),
(43, NULL, NULL, 'Updated joborder', 'joborder', '8', '{\"status\":\"done\"}', '127.0.0.1', '2026-03-25 02:44:18'),
(44, NULL, NULL, 'Created notification', 'notification', '4', '{\"ticketId\":\"204\",\"staffId\":1,\"staffName\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-25 02:44:18'),
(45, NULL, NULL, 'Updated joborder', 'joborder', '6', '{\"status\":\"done\"}', '127.0.0.1', '2026-03-25 02:44:18'),
(46, NULL, NULL, 'Created notification', 'notification', '5', '{\"ticketId\":\"10\",\"staffId\":1,\"staffName\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-25 02:44:19'),
(47, NULL, NULL, 'Updated joborder', 'joborder', '7', '{\"status\":\"done\"}', '127.0.0.1', '2026-03-25 02:44:19'),
(48, NULL, NULL, 'Created notification', 'notification', '6', '{\"ticketId\":\"202\",\"staffId\":1,\"staffName\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-25 02:44:19'),
(49, NULL, NULL, 'Updated joborder', 'joborder', '4', '{\"status\":\"done\"}', '127.0.0.1', '2026-03-25 02:44:19'),
(50, NULL, NULL, 'Created notification', 'notification', '7', '{\"ticketId\":\"121\",\"staffId\":1,\"staffName\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-25 02:44:19'),
(51, NULL, NULL, 'Updated joborder', 'joborder', '2', '{\"status\":\"done\"}', '127.0.0.1', '2026-03-25 02:44:19'),
(52, NULL, NULL, 'Notification approved', 'notification', '5', '{\"ticketId\":10}', '127.0.0.1', '2026-03-25 02:44:23'),
(53, NULL, NULL, 'Notification approved', 'notification', '5', '{\"ticketId\":10}', '127.0.0.1', '2026-03-25 02:44:23'),
(54, NULL, NULL, 'Notification approved', 'notification', '5', '{\"ticketId\":10}', '127.0.0.1', '2026-03-25 02:44:23'),
(55, NULL, NULL, 'Notification approved', 'notification', '5', '{\"ticketId\":10}', '127.0.0.1', '2026-03-25 02:44:23'),
(56, NULL, NULL, 'Notification approved', 'notification', '5', '{\"ticketId\":10}', '127.0.0.1', '2026-03-25 02:44:23'),
(57, NULL, NULL, 'Notification approved', 'notification', '5', '{\"ticketId\":10}', '127.0.0.1', '2026-03-25 02:44:24'),
(58, NULL, NULL, 'Notification approved', 'notification', '5', '{\"ticketId\":10}', '127.0.0.1', '2026-03-25 02:44:24'),
(59, NULL, NULL, 'Notification approved', 'notification', '5', '{\"ticketId\":10}', '127.0.0.1', '2026-03-25 02:44:24'),
(60, NULL, NULL, 'Notification approved', 'notification', '6', '{\"ticketId\":202}', '127.0.0.1', '2026-03-25 02:45:05'),
(61, NULL, NULL, 'Notification approved', 'notification', '6', '{\"ticketId\":202}', '127.0.0.1', '2026-03-25 02:45:06'),
(62, NULL, NULL, 'Notification approved', 'notification', '6', '{\"ticketId\":202}', '127.0.0.1', '2026-03-25 02:45:06'),
(63, NULL, NULL, 'Notification approved', 'notification', '6', '{\"ticketId\":202}', '127.0.0.1', '2026-03-25 02:45:06'),
(64, NULL, NULL, 'Notification approved', 'notification', '6', '{\"ticketId\":202}', '127.0.0.1', '2026-03-25 02:45:07'),
(65, NULL, NULL, 'Notification approved', 'notification', '6', '{\"ticketId\":202}', '127.0.0.1', '2026-03-25 02:45:07'),
(66, NULL, NULL, 'Notification approved', 'notification', '6', '{\"ticketId\":202}', '127.0.0.1', '2026-03-25 02:45:07'),
(67, NULL, NULL, 'Notification approved', 'notification', '6', '{\"ticketId\":202}', '127.0.0.1', '2026-03-25 02:45:07'),
(68, NULL, NULL, 'Notification approved', 'notification', '3', '{\"ticketId\":205}', '127.0.0.1', '2026-03-25 02:45:12'),
(69, NULL, NULL, 'Notification approved', 'notification', '4', '{\"ticketId\":204}', '127.0.0.1', '2026-03-25 02:45:13'),
(70, NULL, NULL, 'Notification approved', 'notification', '7', '{\"ticketId\":121}', '127.0.0.1', '2026-03-25 02:45:14'),
(71, NULL, 'gutierrezdave61@gmail.com', 'Created ticket', 'ticket', 'T933787', '{\"branch\":\"Pateros Post Office\",\"department\":\"Administrative\",\"problem\":\"3\"}', '127.0.0.1', '2026-03-25 03:22:13'),
(72, NULL, NULL, 'Updated ticket', 'ticket', '62', '{\"status\":\"inprogress\",\"acceptedBy\":\"John Smith\",\"acceptedAt\":\"2026-03-25T03:37:15.730Z\"}', '127.0.0.1', '2026-03-25 03:37:15'),
(73, NULL, NULL, 'Accepted ticket', 'ticket', '62', '{\"accepted_by\":\"John Smith\"}', '127.0.0.1', '2026-03-25 03:37:15'),
(74, NULL, NULL, 'Created joborder', 'joborder', '9', '{\"staffId\":3,\"ticketId\":\"62\"}', '127.0.0.1', '2026-03-25 03:37:15'),
(75, NULL, NULL, 'Updated ticket', 'ticket', '197', '{\"status\":\"inprogress\",\"acceptedBy\":\"John Smith\",\"acceptedAt\":\"2026-03-25T03:37:26.444Z\"}', '127.0.0.1', '2026-03-25 03:37:26'),
(76, NULL, NULL, 'Accepted ticket', 'ticket', '197', '{\"accepted_by\":\"John Smith\"}', '127.0.0.1', '2026-03-25 03:37:26'),
(77, NULL, NULL, 'Created joborder', 'joborder', '10', '{\"staffId\":3,\"ticketId\":\"197\"}', '127.0.0.1', '2026-03-25 03:37:26'),
(78, NULL, NULL, 'Updated ticket', 'ticket', '68', '{\"status\":\"inprogress\",\"acceptedBy\":\"John Smith\",\"acceptedAt\":\"2026-03-25T03:37:28.868Z\"}', '127.0.0.1', '2026-03-25 03:37:28'),
(79, NULL, NULL, 'Accepted ticket', 'ticket', '68', '{\"accepted_by\":\"John Smith\"}', '127.0.0.1', '2026-03-25 03:37:28'),
(80, NULL, NULL, 'Created joborder', 'joborder', '11', '{\"staffId\":3,\"ticketId\":\"68\"}', '127.0.0.1', '2026-03-25 03:37:28'),
(81, NULL, NULL, 'Updated ticket', 'ticket', '15', '{\"status\":\"inprogress\",\"acceptedBy\":\"John Smith\",\"acceptedAt\":\"2026-03-25T03:40:55.927Z\"}', '127.0.0.1', '2026-03-25 03:40:55'),
(82, NULL, NULL, 'Accepted ticket', 'ticket', '15', '{\"accepted_by\":\"John Smith\"}', '127.0.0.1', '2026-03-25 03:40:55'),
(83, NULL, NULL, 'Created joborder', 'joborder', '12', '{\"staffId\":3,\"ticketId\":\"15\"}', '127.0.0.1', '2026-03-25 03:40:55'),
(84, NULL, NULL, 'Created notification', 'notification', '8', '{\"ticketId\":\"15\",\"staffId\":3,\"staffName\":\"John Smith\"}', '127.0.0.1', '2026-03-25 04:21:52'),
(85, NULL, NULL, 'Updated joborder', 'joborder', '12', '{\"status\":\"done\"}', '127.0.0.1', '2026-03-25 04:21:52'),
(86, NULL, NULL, 'Notification approved', 'notification', '8', '{\"ticketId\":15}', '127.0.0.1', '2026-03-25 04:22:01'),
(87, NULL, NULL, 'Updated ticket', 'ticket', '165', '{\"status\":\"Pending\",\"id\":\"165\"}', '127.0.0.1', '2026-03-30 00:30:46'),
(88, NULL, NULL, 'Updated ticket', 'ticket', '165', '{\"status\":\"inprogress\",\"acceptedBy\":\"John Smith\",\"acceptedAt\":\"2026-03-30T02:23:20.210Z\"}', '127.0.0.1', '2026-03-30 02:23:20'),
(89, NULL, NULL, 'Accepted ticket', 'ticket', '165', '{\"accepted_by\":\"John Smith\"}', '127.0.0.1', '2026-03-30 02:23:20'),
(90, NULL, NULL, 'Created joborder', 'joborder', '13', '{\"staffId\":3,\"ticketId\":\"165\"}', '127.0.0.1', '2026-03-30 02:23:20'),
(91, NULL, NULL, 'Updated ticket', 'ticket', '150', '{\"status\":\"inprogress\",\"acceptedBy\":\"Swabe Edrian\",\"acceptedAt\":\"2026-03-30T05:33:32.322Z\"}', '127.0.0.1', '2026-03-30 05:33:32'),
(92, NULL, NULL, 'Accepted ticket', 'ticket', '150', '{\"accepted_by\":\"Swabe Edrian\"}', '127.0.0.1', '2026-03-30 05:33:32'),
(93, NULL, NULL, 'Created joborder', 'joborder', '14', '{\"staffId\":1,\"ticketId\":\"150\"}', '127.0.0.1', '2026-03-30 05:33:32'),
(94, NULL, 'jeydi@postoffice.com', 'Created user', 'user', NULL, '{\"role\":\"staff\"}', '127.0.0.1', '2026-03-30 05:53:56'),
(95, NULL, NULL, 'Updated ticket', 'ticket', '208', '{\"status\":\"inprogress\",\"acceptedBy\":\"Jeydi Snow\",\"acceptedAt\":\"2026-03-30T05:55:39.082Z\"}', '127.0.0.1', '2026-03-30 05:55:39'),
(96, NULL, NULL, 'Accepted ticket', 'ticket', '208', '{\"accepted_by\":\"Jeydi Snow\"}', '127.0.0.1', '2026-03-30 05:55:39'),
(97, NULL, NULL, 'Created joborder', 'joborder', '15', '{\"staffId\":4,\"ticketId\":\"208\"}', '127.0.0.1', '2026-03-30 05:55:39'),
(98, NULL, NULL, 'Updated ticket', 'ticket', '208', '{\"remarks\":\"test\"}', '127.0.0.1', '2026-03-30 06:47:17'),
(99, NULL, NULL, 'Updated ticket', 'ticket', '208', '{\"remarks\":\"testtesttest\"}', '127.0.0.1', '2026-03-30 07:10:12'),
(100, NULL, NULL, 'Updated ticket', 'ticket', '165', '{\"remarks\":\"testtest\"}', '127.0.0.1', '2026-03-30 07:36:07'),
(101, NULL, NULL, 'Created notification', 'notification', '9', '{\"ticketId\":\"165\",\"staffId\":3,\"staffName\":\"John Smith\"}', '127.0.0.1', '2026-03-30 07:54:12'),
(102, NULL, NULL, 'Updated joborder', 'joborder', '13', '{\"status\":\"done\"}', '127.0.0.1', '2026-03-30 07:54:12'),
(103, NULL, NULL, 'Notification approved', 'notification', '9', '{\"ticketId\":165}', '127.0.0.1', '2026-03-30 07:54:17'),
(104, NULL, NULL, 'Updated ticket', 'ticket', '68', '{\"remarks\":\"test\"}', '127.0.0.1', '2026-03-31 00:19:38'),
(105, NULL, NULL, 'Created notification', 'notification', '10', '{\"ticketId\":\"68\",\"staffId\":3,\"staffName\":\"John Smith\"}', '127.0.0.1', '2026-03-31 00:23:20'),
(106, NULL, NULL, 'Updated joborder', 'joborder', '11', '{\"status\":\"done\"}', '127.0.0.1', '2026-03-31 00:23:20'),
(107, NULL, NULL, 'Notification approved', 'notification', '10', '{\"ticketId\":68}', '127.0.0.1', '2026-03-31 00:23:24');

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `name`, `createdAt`) VALUES
(1, 'Manila Central Post Office', '2026-03-11 09:42:16'),
(2, 'Makati Central Post Office', '2026-03-11 09:42:16'),
(3, 'Quezon City Central Post Office', '2026-03-11 09:42:16'),
(4, 'Pasay City Post Office', '2026-03-11 09:42:16'),
(5, 'Taguig Post Office', '2026-03-11 09:42:16'),
(6, 'Paranaque Post Office', '2026-03-11 09:42:16'),
(7, 'Las Piñas Post Office', '2026-03-11 09:42:16'),
(8, 'Marikina Central Post Office', '2026-03-11 09:42:16'),
(9, 'San Juan Central Post Office', '2026-03-11 09:42:16'),
(10, 'Pateros Post Office', '2026-03-11 09:42:16'),
(11, 'Valenzuela Post Office', '2026-03-11 09:42:16'),
(12, 'Caloocan Central Post Office', '2026-03-11 09:42:16');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `department` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `department`) VALUES
(1, 'MIS'),
(2, 'Marketing\r\n'),
(3, 'Administrative'),
(4, 'Human Resource'),
(5, 'Accounting');

-- --------------------------------------------------------

--
-- Table structure for table `joborders`
--

CREATE TABLE `joborders` (
  `id` int(11) NOT NULL,
  `staffId` int(11) NOT NULL,
  `ticketId` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'accepted',
  `description` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `joborders`
--

INSERT INTO `joborders` (`id`, `staffId`, `ticketId`, `status`, `description`, `createdAt`, `updatedAt`) VALUES
(1, 1, 136, 'done', 'Accepted ticket for processing', '2026-03-17 08:01:05', '2026-03-17 08:01:10'),
(2, 1, 121, 'done', 'Accepted ticket for processing', '2026-03-17 08:01:41', '2026-03-25 02:44:19'),
(3, 2, 159, 'accepted', 'Accepted ticket for processing', '2026-03-24 04:30:06', '2026-03-24 04:30:06'),
(4, 1, 202, 'done', 'Accepted ticket for processing', '2026-03-24 05:04:02', '2026-03-25 02:44:19'),
(5, 1, 206, 'done', 'Accepted ticket for processing', '2026-03-24 05:52:34', '2026-03-25 02:43:57'),
(6, 1, 204, 'done', 'Accepted ticket for processing', '2026-03-24 05:52:53', '2026-03-25 02:44:18'),
(7, 1, 10, 'done', 'Accepted ticket for processing', '2026-03-24 05:59:24', '2026-03-25 02:44:19'),
(8, 1, 205, 'done', 'Accepted ticket for processing', '2026-03-25 02:37:19', '2026-03-25 02:44:18'),
(9, 3, 62, 'accepted', 'Accepted ticket for processing', '2026-03-25 03:37:15', '2026-03-25 03:37:15'),
(10, 3, 197, 'accepted', 'Accepted ticket for processing', '2026-03-25 03:37:26', '2026-03-25 03:37:26'),
(11, 3, 68, 'done', 'Accepted ticket for processing', '2026-03-25 03:37:28', '2026-03-31 00:23:20'),
(12, 3, 15, 'done', 'Accepted ticket for processing', '2026-03-25 03:40:55', '2026-03-25 04:21:52'),
(13, 3, 165, 'done', 'Accepted ticket for processing', '2026-03-30 02:23:20', '2026-03-30 07:54:12'),
(14, 1, 150, 'accepted', 'Accepted ticket for processing', '2026-03-30 05:33:32', '2026-03-30 05:33:32'),
(15, 4, 208, 'accepted', 'Accepted ticket for processing', '2026-03-30 05:55:39', '2026-03-30 05:55:39');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `ticketId` int(11) NOT NULL,
  `staffId` int(11) NOT NULL,
  `staffName` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `description` text NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `ticketId`, `staffId`, `staffName`, `category`, `branch`, `description`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 136, 1, 'Swabe Edrian', 'IT Concerns', 'Taguig Post Office', 'Sample ticket 136 for it concerns in Parcel Services', 'approved', '2026-03-17 08:01:10', '2026-03-23 02:21:45'),
(2, 206, 1, 'Swabe Edrian', 'IT Concerns - Hardware', 'Quezon City Central Post Office', 'sample ticket', 'approved', '2026-03-25 02:43:57', '2026-03-25 02:44:04'),
(3, 205, 1, 'Swabe Edrian', 'IT Concerns', 'Main', 'Test issue', 'approved', '2026-03-25 02:44:18', '2026-03-25 02:45:12'),
(4, 204, 1, 'Swabe Edrian', 'IT Concerns', 'Main', 'Test issue', 'approved', '2026-03-25 02:44:18', '2026-03-25 02:45:13'),
(5, 10, 1, 'Swabe Edrian', 'IT Concerns', 'Las Piñas Post office', 'Sample ticket 10 for it concerns in IT Support', 'approved', '2026-03-25 02:44:19', '2026-03-25 02:44:23'),
(6, 202, 1, 'Swabe Edrian', 'IT Concerns - Hardware', 'Las Piñas Post Office', 'testtesttesttest', 'approved', '2026-03-25 02:44:19', '2026-03-25 02:45:05'),
(7, 121, 1, 'Swabe Edrian', 'IT Concerns', 'Valenzuela Post Office', 'Sample ticket 121 for it concerns in Mail Services', 'approved', '2026-03-25 02:44:19', '2026-03-25 02:45:14'),
(8, 15, 3, 'John Smith', 'Accounting Concerns', 'Pateros Post Office', 'Sample ticket 15 for accounting concerns in Accounting', 'approved', '2026-03-25 04:21:52', '2026-03-25 04:22:01'),
(9, 165, 3, 'John Smith', 'Accounting Concerns', 'Makati Central Post Office', 'Sample ticket 165 for accounting concerns in Accounting', 'approved', '2026-03-30 07:54:12', '2026-03-30 07:54:17'),
(10, 68, 3, 'John Smith', 'Accounting Concerns', 'San Juan Central Post Office', 'Sample ticket 68 for accounting concerns in Mail Services', 'approved', '2026-03-31 00:23:20', '2026-03-31 00:23:24');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `mainCategory` varchar(255) NOT NULL,
  `subCategory` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `mainCategory`, `subCategory`, `createdAt`) VALUES
(1, 'Administrative Concerns', 'Scheduling', '2026-03-17 03:01:23'),
(2, 'Administrative Concerns', 'Policy', '2026-03-17 03:01:23'),
(3, 'Operational Concerns', 'Logistics', '2026-03-17 03:01:23'),
(4, 'Operational Concerns', 'Facilities', '2026-03-17 03:01:23'),
(5, 'IT Concerns', 'Software', '2026-03-17 03:01:23'),
(6, 'IT Concerns', 'Hardware', '2026-03-17 03:01:23'),
(7, 'Accounting Concerns', 'Invoices', '2026-03-17 03:01:23'),
(8, 'Accounting Concerns', 'Payroll', '2026-03-17 03:01:23'),
(9, 'Human Resource Concerns', 'Recruitment', '2026-03-17 03:01:23'),
(10, 'Human Resource Concerns', 'Training', '2026-03-17 03:01:23'),
(11, 'Marketing Concerns', 'Campaigns', '2026-03-17 03:01:23'),
(12, 'Marketing Concerns', 'Public Relations', '2026-03-17 03:01:23');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `userId`, `firstName`, `lastName`, `createdAt`) VALUES
(1, 8, 'Swabe', 'Edrian', '2026-03-17 05:16:58'),
(2, 4, 'Sarah', 'Johnson', '2026-03-23 08:57:26'),
(3, 3, 'John', 'Smith', '2026-03-25 03:37:08'),
(4, 10, 'Jeydi', 'Snow', '2026-03-30 05:55:23');

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `ticket_number` varchar(255) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `accepted_by` varchar(255) DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `remarks` varchar(255) DEFAULT NULL,
  `ticker` varchar(255) DEFAULT NULL,
  `acceptedBy` varchar(255) DEFAULT NULL,
  `acceptedAt` timestamp NULL DEFAULT NULL,
  `completedAt` timestamp NULL DEFAULT NULL,
  `ticketId` varchar(255) DEFAULT NULL,
  `customerName` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tickets`
--

INSERT INTO `tickets` (`id`, `ticket_number`, `customer_name`, `email`, `branch`, `department`, `category`, `description`, `status`, `accepted_by`, `accepted_at`, `completed_at`, `created_at`, `updated_at`, `remarks`, `ticker`, `acceptedBy`, `acceptedAt`, `completedAt`, `ticketId`, `customerName`) VALUES
(1, 'T700001', 'Carol Williams', 'carol.williams@example.com', 'Caloocan Central Post Office', 'Parcel Services', 'Human Resource Concerns', 'Sample ticket 1 for human resource concerns in Parcel Services', 'completed', 'david.wilson@postoffice.com', '2026-01-31 20:14:55', '2026-02-05 02:02:40', '2026-01-31 19:01:23', '2026-01-31 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'T700002', 'Grace Wilson', 'grace.wilson@example.com', 'Valenzuela Post Office', 'Parcel Services', 'IT Concerns', 'Sample ticket 2 for it concerns in Parcel Services', 'completed', 'john.smith@postoffice.com', '2026-01-20 20:17:41', '2026-01-22 01:33:42', '2026-01-20 19:01:23', '2026-01-20 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'T700003', 'David Brown', 'david.brown@example.com', 'Pateros Post Office', 'Mail Services', 'Accounting Concerns', 'Sample ticket 3 for accounting concerns in Mail Services', 'pending', NULL, NULL, NULL, '2026-01-29 19:01:23', '2026-01-29 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'T700004', 'Emma Davis', 'emma.davis@example.com', 'Paranaque Post Office', 'IT Support', 'Operational Concerns', 'Sample ticket 4 for operational concerns in IT Support', 'pending', NULL, NULL, NULL, '2025-12-18 19:01:23', '2025-12-18 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'T700005', 'Henry Taylor', 'henry.taylor@example.com', 'Las Piñas Post office', 'IT Support', 'Accounting Concerns', 'Sample ticket 5 for accounting concerns in IT Support', 'inprogress', 'emily.davis@postoffice.com', '2025-12-23 20:01:56', NULL, '2025-12-23 19:01:23', '2025-12-23 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 'T700006', 'Bob Smith', 'bob.smith@example.com', 'Las Piñas Post office', 'IT Support', 'Accounting Concerns', 'Sample ticket 6 for accounting concerns in IT Support', 'awaitingapproval', 'sarah.johnson@postoffice.com', '2026-01-24 08:19:07', NULL, '2026-01-23 19:01:23', '2026-01-23 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 'T700007', 'Carol Williams', 'carol.williams@example.com', 'Pasay City Post Office', 'Mail Services', 'Operational Concerns', 'Sample ticket 7 for operational concerns in Mail Services', 'completed', 'michael.brown@postoffice.com', '2026-02-28 16:29:53', '2026-03-06 12:38:27', '2026-02-27 19:01:23', '2026-02-27 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'T700008', 'Frank Miller', 'frank.miller@example.com', 'Pasay City Post Office', 'Accounting', 'Administrative Concerns', 'Sample ticket 8 for administrative concerns in Accounting', 'pending', NULL, NULL, NULL, '2026-01-16 19:01:23', '2026-01-16 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'T700009', 'Grace Wilson', 'grace.wilson@example.com', 'Las Piñas Post office', 'IT Support', 'Operational Concerns', 'Sample ticket 9 for operational concerns in IT Support', 'completed', 'david.wilson@postoffice.com', '2025-12-28 06:45:35', '2026-01-02 21:25:38', '2025-12-27 19:01:23', '2025-12-27 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 'T700010', 'Ivy Anderson', 'ivy.anderson@example.com', 'Las Piñas Post office', 'IT Support', 'IT Concerns', 'Sample ticket 10 for it concerns in IT Support', 'completed', 'Swabe Edrian', '2026-03-23 21:59:24', NULL, '2025-12-27 19:01:23', '2026-03-25 02:44:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 'T700011', 'Emma Davis', 'emma.davis@example.com', 'Las Piñas Post office', 'Accounting', 'Operational Concerns', 'Sample ticket 11 for operational concerns in Accounting', 'inprogress', 'emily.davis@postoffice.com', '2026-03-11 20:25:58', NULL, '2026-03-11 19:01:23', '2026-03-11 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 'T700012', 'Henry Taylor', 'henry.taylor@example.com', 'Pateros Post Office', 'Parcel Services', 'Operational Concerns', 'Sample ticket 12 for operational concerns in Parcel Services', 'completed', 'sarah.johnson@postoffice.com', '2025-12-31 12:38:14', '2026-01-01 17:42:40', '2025-12-30 19:01:23', '2025-12-30 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 'T700013', 'Ivy Anderson', 'ivy.anderson@example.com', 'Paranaque Post Office', 'Customer Service', 'Human Resource Concerns', 'Sample ticket 13 for human resource concerns in Customer Service', 'completed', 'john.smith@postoffice.com', '2025-12-18 11:27:06', '2025-12-22 21:11:24', '2025-12-17 19:01:23', '2025-12-17 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 'T700014', 'David Brown', 'david.brown@example.com', 'Marikina Central Post Office', 'IT Support', 'Administrative Concerns', 'Sample ticket 14 for administrative concerns in IT Support', 'awaitingapproval', 'emily.davis@postoffice.com', '2026-01-01 21:39:54', NULL, '2026-01-01 19:01:23', '2026-01-01 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 'T700015', 'Carol Williams', 'carol.williams@example.com', 'Pateros Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 15 for accounting concerns in Accounting', 'completed', 'John Smith', '2026-03-24 19:40:55', NULL, '2026-01-24 19:01:23', '2026-03-25 04:22:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 'T700016', 'Alice Johnson', 'alice.johnson@example.com', 'Marikina Central Post Office', 'IT Support', 'Human Resource Concerns', 'Sample ticket 16 for human resource concerns in IT Support', 'awaitingapproval', 'sarah.johnson@postoffice.com', '2025-12-19 01:00:33', NULL, '2025-12-18 19:01:23', '2025-12-18 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 'T700017', 'Alice Johnson', 'alice.johnson@example.com', 'Caloocan Central Post Office', 'Parcel Services', 'Human Resource Concerns', 'Sample ticket 17 for human resource concerns in Parcel Services', 'pending', NULL, NULL, NULL, '2026-01-29 19:01:23', '2026-01-29 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 'T700018', 'Henry Taylor', 'henry.taylor@example.com', 'Valenzuela Post Office', 'Accounting', 'Administrative Concerns', 'Sample ticket 18 for administrative concerns in Accounting', 'completed', 'john.smith@postoffice.com', '2026-02-16 00:52:48', '2026-02-20 22:50:48', '2026-02-15 19:01:23', '2026-02-15 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 'T700019', 'Ivy Anderson', 'ivy.anderson@example.com', 'Manila Central Post Office', 'Parcel Services', 'IT Concerns', 'Sample ticket 19 for it concerns in Parcel Services', 'inprogress', 'emily.davis@postoffice.com', '2026-03-08 07:15:24', NULL, '2026-03-07 19:01:23', '2026-03-07 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 'T700020', 'Emma Davis', 'emma.davis@example.com', 'Taguig Post Office', 'Customer Service', 'Human Resource Concerns', 'Sample ticket 20 for human resource concerns in Customer Service', 'inprogress', 'emily.davis@postoffice.com', '2026-02-24 10:36:48', NULL, '2026-02-23 19:01:23', '2026-02-23 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 'T700021', 'Alice Johnson', 'alice.johnson@example.com', 'San Juan Central Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 21 for accounting concerns in Accounting', 'inprogress', 'sarah.johnson@postoffice.com', '2026-03-04 04:01:39', NULL, '2026-03-03 19:01:23', '2026-03-03 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 'T700022', 'Grace Wilson', 'grace.wilson@example.com', 'Pateros Post Office', 'Mail Services', 'Human Resource Concerns', 'Sample ticket 22 for human resource concerns in Mail Services', 'pending', NULL, NULL, NULL, '2026-02-08 19:01:23', '2026-02-08 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, 'T700023', 'Bob Smith', 'bob.smith@example.com', 'Marikina Central Post Office', 'IT Support', 'IT Concerns', 'Sample ticket 23 for it concerns in IT Support', 'awaitingapproval', 'sarah.johnson@postoffice.com', '2026-03-15 23:52:21', NULL, '2026-03-15 19:01:23', '2026-03-15 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 'T700024', 'Carol Williams', 'carol.williams@example.com', 'Makati Central Post Office', 'IT Support', 'Operational Concerns', 'Sample ticket 24 for operational concerns in IT Support', 'completed', 'john.smith@postoffice.com', '2025-12-20 02:25:16', '2025-12-20 15:18:43', '2025-12-19 19:01:23', '2025-12-19 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 'T700025', 'Alice Johnson', 'alice.johnson@example.com', 'Valenzuela Post Office', 'Mail Services', 'Accounting Concerns', 'Sample ticket 25 for accounting concerns in Mail Services', 'completed', 'sarah.johnson@postoffice.com', '2025-12-21 03:23:03', '2025-12-23 21:43:22', '2025-12-20 19:01:23', '2025-12-20 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, 'T700026', 'Grace Wilson', 'grace.wilson@example.com', 'Marikina Central Post Office', 'Accounting', 'Administrative Concerns', 'Sample ticket 26 for administrative concerns in Accounting', 'awaitingapproval', 'michael.brown@postoffice.com', '2025-12-21 15:04:54', NULL, '2025-12-20 19:01:23', '2025-12-20 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(27, 'T700027', 'Ivy Anderson', 'ivy.anderson@example.com', 'Marikina Central Post Office', 'Mail Services', 'IT Concerns', 'Sample ticket 27 for it concerns in Mail Services', 'awaitingapproval', 'michael.brown@postoffice.com', '2026-02-11 02:42:21', NULL, '2026-02-10 19:01:23', '2026-02-10 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 'T700028', 'Alice Johnson', 'alice.johnson@example.com', 'Taguig Post Office', 'Customer Service', 'Administrative Concerns', 'Sample ticket 28 for administrative concerns in Customer Service', 'completed', 'john.smith@postoffice.com', '2025-12-18 18:27:02', '2025-12-24 10:55:49', '2025-12-17 19:01:23', '2025-12-17 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(29, 'T700029', 'Ivy Anderson', 'ivy.anderson@example.com', 'Pasay City Post Office', 'Mail Services', 'Accounting Concerns', 'Sample ticket 29 for accounting concerns in Mail Services', 'inprogress', 'sarah.johnson@postoffice.com', '2026-02-14 01:56:24', NULL, '2026-02-13 19:01:23', '2026-02-13 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 'T700030', 'Carol Williams', 'carol.williams@example.com', 'Manila Central Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 30 for accounting concerns in Accounting', 'inprogress', 'emily.davis@postoffice.com', '2026-02-17 15:56:34', NULL, '2026-02-16 19:01:23', '2026-02-16 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, 'T700031', 'Henry Taylor', 'henry.taylor@example.com', 'Paranaque Post Office', 'IT Support', 'Operational Concerns', 'Sample ticket 31 for operational concerns in IT Support', 'pending', NULL, NULL, NULL, '2026-02-13 19:01:23', '2026-02-13 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, 'T700032', 'Grace Wilson', 'grace.wilson@example.com', 'Marikina Central Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 32 for accounting concerns in Accounting', 'completed', 'michael.brown@postoffice.com', '2026-01-28 20:41:05', '2026-01-29 19:55:19', '2026-01-28 19:01:23', '2026-01-28 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, 'T700033', 'Alice Johnson', 'alice.johnson@example.com', 'Makati Central Post Office', 'Parcel Services', 'Operational Concerns', 'Sample ticket 33 for operational concerns in Parcel Services', 'pending', NULL, NULL, NULL, '2026-01-17 19:01:23', '2026-01-17 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(34, 'T700034', 'Frank Miller', 'frank.miller@example.com', 'Taguig Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 34 for accounting concerns in Accounting', 'completed', 'john.smith@postoffice.com', '2026-01-25 03:51:28', '2026-02-01 00:32:41', '2026-01-24 19:01:23', '2026-01-24 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(35, 'T700035', 'Grace Wilson', 'grace.wilson@example.com', 'Manila Central Post Office', 'Customer Service', 'IT Concerns', 'Sample ticket 35 for it concerns in Customer Service', 'completed', 'sarah.johnson@postoffice.com', '2026-02-02 12:43:52', '2026-02-07 03:58:39', '2026-02-01 19:01:23', '2026-02-01 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(36, 'T700036', 'David Brown', 'david.brown@example.com', 'Makati Central Post Office', 'Accounting', 'Operational Concerns', 'Sample ticket 36 for operational concerns in Accounting', 'pending', NULL, NULL, NULL, '2026-01-02 19:01:23', '2026-01-02 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(37, 'T700037', 'Henry Taylor', 'henry.taylor@example.com', 'Quezon City Central Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 37 for accounting concerns in Accounting', 'awaitingapproval', 'michael.brown@postoffice.com', '2025-12-18 12:15:28', NULL, '2025-12-17 19:01:23', '2025-12-17 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(38, 'T700038', 'David Brown', 'david.brown@example.com', 'Taguig Post Office', 'Accounting', 'Operational Concerns', 'Sample ticket 38 for operational concerns in Accounting', 'pending', NULL, NULL, NULL, '2026-01-13 19:01:23', '2026-01-13 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(39, 'T700039', 'Grace Wilson', 'grace.wilson@example.com', 'Pasay City Post Office', 'Accounting', 'Administrative Concerns', 'Sample ticket 39 for administrative concerns in Accounting', 'completed', 'sarah.johnson@postoffice.com', '2026-02-18 18:56:50', '2026-02-24 08:06:38', '2026-02-17 19:01:23', '2026-02-17 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(40, 'T700040', 'David Brown', 'david.brown@example.com', 'Makati Central Post Office', 'Customer Service', 'Human Resource Concerns', 'Sample ticket 40 for human resource concerns in Customer Service', 'completed', 'david.wilson@postoffice.com', '2026-03-07 10:42:51', '2026-03-13 15:11:54', '2026-03-06 19:01:23', '2026-03-06 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(41, 'T700041', 'Frank Miller', 'frank.miller@example.com', 'Quezon City Central Post Office', 'Mail Services', 'Operational Concerns', 'Sample ticket 41 for operational concerns in Mail Services', 'inprogress', 'michael.brown@postoffice.com', '2026-03-08 10:18:49', NULL, '2026-03-07 19:01:23', '2026-03-07 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(42, 'T700042', 'Frank Miller', 'frank.miller@example.com', 'Manila Central Post Office', 'Accounting', 'IT Concerns', 'Sample ticket 42 for it concerns in Accounting', 'awaitingapproval', 'david.wilson@postoffice.com', '2026-03-09 16:46:24', NULL, '2026-03-08 19:01:23', '2026-03-08 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(43, 'T700043', 'Henry Taylor', 'henry.taylor@example.com', 'Marikina Central Post Office', 'IT Support', 'Human Resource Concerns', 'Sample ticket 43 for human resource concerns in IT Support', 'inprogress', 'sarah.johnson@postoffice.com', '2026-01-01 16:38:26', NULL, '2025-12-31 19:01:23', '2025-12-31 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(44, 'T700044', 'Alice Johnson', 'alice.johnson@example.com', 'Caloocan Central Post Office', 'IT Support', 'IT Concerns', 'Sample ticket 44 for it concerns in IT Support', 'inprogress', 'david.wilson@postoffice.com', '2026-02-11 07:33:22', NULL, '2026-02-10 19:01:23', '2026-02-10 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(45, 'T700045', 'Frank Miller', 'frank.miller@example.com', 'Manila Central Post Office', 'Parcel Services', 'Human Resource Concerns', 'Sample ticket 45 for human resource concerns in Parcel Services', 'completed', 'emily.davis@postoffice.com', '2026-01-04 07:04:33', '2026-01-04 14:20:35', '2026-01-03 19:01:23', '2026-01-03 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(46, 'T700046', 'Henry Taylor', 'henry.taylor@example.com', 'Taguig Post Office', 'Parcel Services', 'Operational Concerns', 'Sample ticket 46 for operational concerns in Parcel Services', 'pending', NULL, NULL, NULL, '2026-03-14 19:01:23', '2026-03-14 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(47, 'T700047', 'Jack Thomas', 'jack.thomas@example.com', 'Manila Central Post Office', 'Mail Services', 'Operational Concerns', 'Sample ticket 47 for operational concerns in Mail Services', 'awaitingapproval', 'michael.brown@postoffice.com', '2026-03-08 16:15:25', NULL, '2026-03-07 19:01:23', '2026-03-07 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(48, 'T700048', 'David Brown', 'david.brown@example.com', 'Taguig Post Office', 'IT Support', 'Operational Concerns', 'Sample ticket 48 for operational concerns in IT Support', 'inprogress', 'sarah.johnson@postoffice.com', '2026-02-02 01:17:20', NULL, '2026-02-01 19:01:23', '2026-02-01 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(49, 'T700049', 'David Brown', 'david.brown@example.com', 'Quezon City Central Post Office', 'Customer Service', 'Operational Concerns', 'Sample ticket 49 for operational concerns in Customer Service', 'pending', NULL, NULL, NULL, '2026-01-30 19:01:23', '2026-01-30 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(50, 'T700050', 'Frank Miller', 'frank.miller@example.com', 'Quezon City Central Post Office', 'Mail Services', 'Administrative Concerns', 'Sample ticket 50 for administrative concerns in Mail Services', 'completed', 'david.wilson@postoffice.com', '2026-01-25 03:45:48', '2026-01-27 00:41:49', '2026-01-24 19:01:23', '2026-01-24 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(51, 'T700051', 'David Brown', 'david.brown@example.com', 'Marikina Central Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 51 for accounting concerns in Accounting', 'inprogress', 'john.smith@postoffice.com', '2026-02-08 15:46:26', NULL, '2026-02-07 19:01:23', '2026-02-07 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(52, 'T700052', 'Frank Miller', 'frank.miller@example.com', 'Makati Central Post Office', 'Customer Service', 'Administrative Concerns', 'Sample ticket 52 for administrative concerns in Customer Service', 'completed', 'john.smith@postoffice.com', '2026-01-17 14:16:37', '2026-01-18 08:09:10', '2026-01-16 19:01:23', '2026-01-16 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(53, 'T700053', 'Ivy Anderson', 'ivy.anderson@example.com', 'Valenzuela Post Office', 'Customer Service', 'Operational Concerns', 'Sample ticket 53 for operational concerns in Customer Service', 'inprogress', 'david.wilson@postoffice.com', '2026-02-27 05:02:11', NULL, '2026-02-26 19:01:23', '2026-02-26 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(54, 'T700054', 'Alice Johnson', 'alice.johnson@example.com', 'Pateros Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 54 for accounting concerns in Accounting', 'awaitingapproval', 'sarah.johnson@postoffice.com', '2025-12-24 10:25:27', NULL, '2025-12-23 19:01:23', '2025-12-23 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(55, 'T700055', 'Emma Davis', 'emma.davis@example.com', 'Pateros Post Office', 'Accounting', 'Administrative Concerns', 'Sample ticket 55 for administrative concerns in Accounting', 'completed', 'emily.davis@postoffice.com', '2026-02-16 17:38:56', '2026-02-17 12:05:48', '2026-02-15 19:01:23', '2026-02-15 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(56, 'T700056', 'Frank Miller', 'frank.miller@example.com', 'Marikina Central Post Office', 'Accounting', 'IT Concerns', 'Sample ticket 56 for it concerns in Accounting', 'completed', 'john.smith@postoffice.com', '2026-03-05 18:59:43', '2026-03-11 19:40:47', '2026-03-04 19:01:23', '2026-03-04 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(57, 'T700057', 'Carol Williams', 'carol.williams@example.com', 'Pasay City Post Office', 'IT Support', 'IT Concerns', 'Sample ticket 57 for it concerns in IT Support', 'inprogress', 'david.wilson@postoffice.com', '2026-01-16 02:48:03', NULL, '2026-01-15 19:01:23', '2026-01-15 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(58, 'T700058', 'Bob Smith', 'bob.smith@example.com', 'Makati Central Post Office', 'IT Support', 'Accounting Concerns', 'Sample ticket 58 for accounting concerns in IT Support', 'pending', NULL, NULL, NULL, '2026-02-16 19:01:23', '2026-02-16 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(59, 'T700059', 'David Brown', 'david.brown@example.com', 'San Juan Central Post Office', 'Customer Service', 'Operational Concerns', 'Sample ticket 59 for operational concerns in Customer Service', 'completed', 'david.wilson@postoffice.com', '2026-01-28 20:39:34', '2026-01-30 03:48:51', '2026-01-28 19:01:23', '2026-01-28 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(60, 'T700060', 'Bob Smith', 'bob.smith@example.com', 'Pasay City Post Office', 'Accounting', 'Human Resource Concerns', 'Sample ticket 60 for human resource concerns in Accounting', 'completed', 'john.smith@postoffice.com', '2025-12-23 00:51:25', '2025-12-25 07:17:28', '2025-12-22 19:01:23', '2025-12-22 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(61, 'T700061', 'Alice Johnson', 'alice.johnson@example.com', 'San Juan Central Post Office', 'Parcel Services', 'Operational Concerns', 'Sample ticket 61 for operational concerns in Parcel Services', 'inprogress', 'emily.davis@postoffice.com', '2026-01-07 14:11:07', NULL, '2026-01-06 19:01:23', '2026-01-06 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(62, 'T700062', 'Frank Miller', 'frank.miller@example.com', 'Pasay City Post Office', 'Parcel Services', 'Accounting Concerns', 'Sample ticket 62 for accounting concerns in Parcel Services', 'inprogress', 'John Smith', '2026-03-24 19:37:15', NULL, '2025-12-29 19:01:23', '2026-03-25 03:37:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(63, 'T700063', 'Henry Taylor', 'henry.taylor@example.com', 'Las Piñas Post office', 'Accounting', 'Human Resource Concerns', 'Sample ticket 63 for human resource concerns in Accounting', 'awaitingapproval', 'john.smith@postoffice.com', '2025-12-27 02:49:15', NULL, '2025-12-26 19:01:23', '2025-12-26 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(64, 'T700064', 'Bob Smith', 'bob.smith@example.com', 'Makati Central Post Office', 'Mail Services', 'Human Resource Concerns', 'Sample ticket 64 for human resource concerns in Mail Services', 'awaitingapproval', 'david.wilson@postoffice.com', '2026-03-01 04:44:44', NULL, '2026-02-28 19:01:23', '2026-02-28 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(65, 'T700065', 'Alice Johnson', 'alice.johnson@example.com', 'Caloocan Central Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 65 for accounting concerns in Accounting', 'completed', 'emily.davis@postoffice.com', '2026-01-20 09:08:14', '2026-01-24 07:12:20', '2026-01-19 19:01:23', '2026-01-19 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(66, 'T700066', 'Alice Johnson', 'alice.johnson@example.com', 'Las Piñas Post office', 'Parcel Services', 'Human Resource Concerns', 'Sample ticket 66 for human resource concerns in Parcel Services', 'awaitingapproval', 'michael.brown@postoffice.com', '2026-01-03 15:30:54', NULL, '2026-01-02 19:01:23', '2026-01-02 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(67, 'T700067', 'Jack Thomas', 'jack.thomas@example.com', 'Valenzuela Post Office', 'Parcel Services', 'Operational Concerns', 'Sample ticket 67 for operational concerns in Parcel Services', 'inprogress', 'david.wilson@postoffice.com', '2026-02-07 18:39:46', NULL, '2026-02-06 19:01:23', '2026-02-06 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(68, 'T700068', 'Ivy Anderson', 'ivy.anderson@example.com', 'San Juan Central Post Office', 'Mail Services', 'Accounting Concerns', 'Sample ticket 68 for accounting concerns in Mail Services', 'completed', 'John Smith', '2026-03-24 19:37:28', NULL, '2026-01-16 19:01:23', '2026-03-31 00:23:24', 'test', NULL, NULL, NULL, NULL, NULL, NULL),
(69, 'T700069', 'David Brown', 'david.brown@example.com', 'Caloocan Central Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 69 for accounting concerns in Accounting', 'completed', 'sarah.johnson@postoffice.com', '2026-03-03 00:29:46', '2026-03-03 19:36:03', '2026-03-02 19:01:23', '2026-03-02 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(70, 'T700070', 'Ivy Anderson', 'ivy.anderson@example.com', 'Manila Central Post Office', 'Customer Service', 'Administrative Concerns', 'Sample ticket 70 for administrative concerns in Customer Service', 'completed', 'michael.brown@postoffice.com', '2025-12-21 00:43:45', '2025-12-24 22:48:58', '2025-12-20 19:01:23', '2025-12-20 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(71, 'T700071', 'Alice Johnson', 'alice.johnson@example.com', 'San Juan Central Post Office', 'IT Support', 'Administrative Concerns', 'Sample ticket 71 for administrative concerns in IT Support', 'completed', 'david.wilson@postoffice.com', '2026-01-14 08:51:40', '2026-01-15 05:21:56', '2026-01-13 19:01:23', '2026-01-13 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(72, 'T700072', 'Alice Johnson', 'alice.johnson@example.com', 'Pateros Post Office', 'Parcel Services', 'Accounting Concerns', 'Sample ticket 72 for accounting concerns in Parcel Services', 'inprogress', 'sarah.johnson@postoffice.com', '2026-02-11 16:55:20', NULL, '2026-02-10 19:01:23', '2026-02-10 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(73, 'T700073', 'Emma Davis', 'emma.davis@example.com', 'Caloocan Central Post Office', 'Customer Service', 'IT Concerns', 'Sample ticket 73 for it concerns in Customer Service', 'inprogress', 'michael.brown@postoffice.com', '2026-01-18 04:45:29', NULL, '2026-01-17 19:01:23', '2026-01-17 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(74, 'T700074', 'David Brown', 'david.brown@example.com', 'Caloocan Central Post Office', 'Mail Services', 'Operational Concerns', 'Sample ticket 74 for operational concerns in Mail Services', 'pending', NULL, NULL, NULL, '2025-12-22 19:01:23', '2025-12-22 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(75, 'T700075', 'Emma Davis', 'emma.davis@example.com', 'Las Piñas Post office', 'IT Support', 'Administrative Concerns', 'Sample ticket 75 for administrative concerns in IT Support', 'inprogress', 'emily.davis@postoffice.com', '2026-01-30 09:40:31', NULL, '2026-01-29 19:01:23', '2026-01-29 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(76, 'T700076', 'Emma Davis', 'emma.davis@example.com', 'Taguig Post Office', 'Mail Services', 'Administrative Concerns', 'Sample ticket 76 for administrative concerns in Mail Services', 'pending', NULL, NULL, NULL, '2026-01-30 19:01:23', '2026-01-30 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(77, 'T700077', 'Bob Smith', 'bob.smith@example.com', 'Makati Central Post Office', 'Customer Service', 'Administrative Concerns', 'Sample ticket 77 for administrative concerns in Customer Service', 'inprogress', 'michael.brown@postoffice.com', '2026-01-01 01:25:00', NULL, '2025-12-31 19:01:23', '2025-12-31 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(78, 'T700078', 'Grace Wilson', 'grace.wilson@example.com', 'Las Piñas Post office', 'Parcel Services', 'IT Concerns', 'Sample ticket 78 for it concerns in Parcel Services', 'awaitingapproval', 'michael.brown@postoffice.com', '2026-01-21 02:45:51', NULL, '2026-01-20 19:01:23', '2026-01-20 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(79, 'T700079', 'Emma Davis', 'emma.davis@example.com', 'Las Piñas Post office', 'Mail Services', 'Administrative Concerns', 'Sample ticket 79 for administrative concerns in Mail Services', 'pending', NULL, NULL, NULL, '2026-02-19 19:01:23', '2026-02-19 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(80, 'T700080', 'Ivy Anderson', 'ivy.anderson@example.com', 'Manila Central Post Office', 'Parcel Services', 'Operational Concerns', 'Sample ticket 80 for operational concerns in Parcel Services', 'completed', 'david.wilson@postoffice.com', '2026-03-09 13:54:11', '2026-03-11 12:26:39', '2026-03-08 19:01:23', '2026-03-08 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(81, 'T700081', 'Frank Miller', 'frank.miller@example.com', 'Valenzuela Post Office', 'IT Support', 'IT Concerns', 'Sample ticket 81 for it concerns in IT Support', 'inprogress', 'sarah.johnson@postoffice.com', '2026-01-29 02:01:48', NULL, '2026-01-28 19:01:23', '2026-01-28 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(82, 'T700082', 'Bob Smith', 'bob.smith@example.com', 'Valenzuela Post Office', 'Accounting', 'Operational Concerns', 'Sample ticket 82 for operational concerns in Accounting', 'awaitingapproval', 'david.wilson@postoffice.com', '2026-02-16 12:07:57', NULL, '2026-02-15 19:01:23', '2026-02-15 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(83, 'T700083', 'David Brown', 'david.brown@example.com', 'Makati Central Post Office', 'Customer Service', 'Accounting Concerns', 'Sample ticket 83 for accounting concerns in Customer Service', 'completed', 'sarah.johnson@postoffice.com', '2026-02-26 05:47:41', '2026-03-03 04:40:46', '2026-02-25 19:01:23', '2026-02-25 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(84, 'T700084', 'Jack Thomas', 'jack.thomas@example.com', 'Paranaque Post Office', 'IT Support', 'IT Concerns', 'Sample ticket 84 for it concerns in IT Support', 'completed', 'sarah.johnson@postoffice.com', '2026-02-23 14:47:58', '2026-02-27 20:12:22', '2026-02-22 19:01:23', '2026-02-22 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(85, 'T700085', 'Bob Smith', 'bob.smith@example.com', 'Taguig Post Office', 'Mail Services', 'Administrative Concerns', 'Sample ticket 85 for administrative concerns in Mail Services', 'completed', 'david.wilson@postoffice.com', '2026-03-01 21:10:11', '2026-03-06 01:51:38', '2026-03-01 19:01:23', '2026-03-01 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(86, 'T700086', 'Bob Smith', 'bob.smith@example.com', 'Paranaque Post Office', 'Mail Services', 'Accounting Concerns', 'Sample ticket 86 for accounting concerns in Mail Services', 'awaitingapproval', 'emily.davis@postoffice.com', '2026-01-09 04:50:58', NULL, '2026-01-08 19:01:23', '2026-01-08 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(87, 'T700087', 'Ivy Anderson', 'ivy.anderson@example.com', 'Quezon City Central Post Office', 'Mail Services', 'Administrative Concerns', 'Sample ticket 87 for administrative concerns in Mail Services', 'inprogress', 'david.wilson@postoffice.com', '2026-01-17 12:02:08', NULL, '2026-01-16 19:01:23', '2026-01-16 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(88, 'T700088', 'Grace Wilson', 'grace.wilson@example.com', 'Las Piñas Post office', 'Mail Services', 'IT Concerns', 'Sample ticket 88 for it concerns in Mail Services', 'completed', 'david.wilson@postoffice.com', '2026-01-19 01:55:06', '2026-01-21 23:46:17', '2026-01-18 19:01:23', '2026-01-18 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(89, 'T700089', 'David Brown', 'david.brown@example.com', 'Caloocan Central Post Office', 'Parcel Services', 'Human Resource Concerns', 'Sample ticket 89 for human resource concerns in Parcel Services', 'completed', 'michael.brown@postoffice.com', '2026-03-11 14:21:45', '2026-03-16 12:51:17', '2026-03-10 19:01:23', '2026-03-10 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(90, 'T700090', 'Emma Davis', 'emma.davis@example.com', 'Caloocan Central Post Office', 'Mail Services', 'Human Resource Concerns', 'Sample ticket 90 for human resource concerns in Mail Services', 'awaitingapproval', 'sarah.johnson@postoffice.com', '2026-02-26 12:21:36', NULL, '2026-02-25 19:01:23', '2026-02-25 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(91, 'T700091', 'Frank Miller', 'frank.miller@example.com', 'Valenzuela Post Office', 'Customer Service', 'Administrative Concerns', 'Sample ticket 91 for administrative concerns in Customer Service', 'awaitingapproval', 'emily.davis@postoffice.com', '2026-03-10 11:28:18', NULL, '2026-03-09 19:01:23', '2026-03-09 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(92, 'T700092', 'Jack Thomas', 'jack.thomas@example.com', 'Paranaque Post Office', 'IT Support', 'Accounting Concerns', 'Sample ticket 92 for accounting concerns in IT Support', 'inprogress', 'sarah.johnson@postoffice.com', '2026-03-07 01:33:33', NULL, '2026-03-06 19:01:23', '2026-03-06 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(93, 'T700093', 'Henry Taylor', 'henry.taylor@example.com', 'Caloocan Central Post Office', 'Customer Service', 'Administrative Concerns', 'Sample ticket 93 for administrative concerns in Customer Service', 'inprogress', 'michael.brown@postoffice.com', '2026-03-06 12:17:00', NULL, '2026-03-05 19:01:23', '2026-03-05 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(94, 'T700094', 'Ivy Anderson', 'ivy.anderson@example.com', 'Las Piñas Post office', 'Accounting', 'Administrative Concerns', 'Sample ticket 94 for administrative concerns in Accounting', 'completed', 'emily.davis@postoffice.com', '2026-02-28 20:53:47', '2026-03-03 19:48:23', '2026-02-28 19:01:23', '2026-02-28 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(95, 'T700095', 'Grace Wilson', 'grace.wilson@example.com', 'Taguig Post Office', 'Accounting', 'Administrative Concerns', 'Sample ticket 95 for administrative concerns in Accounting', 'pending', NULL, NULL, NULL, '2026-01-13 19:01:23', '2026-01-13 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(96, 'T700096', 'Grace Wilson', 'grace.wilson@example.com', 'Makati Central Post Office', 'Customer Service', 'IT Concerns', 'Sample ticket 96 for it concerns in Customer Service', 'awaitingapproval', 'john.smith@postoffice.com', '2026-02-07 18:52:28', NULL, '2026-02-06 19:01:23', '2026-02-06 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(97, 'T700097', 'Jack Thomas', 'jack.thomas@example.com', 'Makati Central Post Office', 'Mail Services', 'Administrative Concerns', 'Sample ticket 97 for administrative concerns in Mail Services', 'completed', 'emily.davis@postoffice.com', '2026-03-01 17:46:24', '2026-03-03 05:46:28', '2026-02-28 19:01:23', '2026-02-28 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(98, 'T700098', 'Bob Smith', 'bob.smith@example.com', 'Caloocan Central Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 98 for accounting concerns in Accounting', 'completed', 'john.smith@postoffice.com', '2026-02-17 04:53:24', '2026-02-19 17:51:28', '2026-02-16 19:01:23', '2026-02-16 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(99, 'T700099', 'Carol Williams', 'carol.williams@example.com', 'Valenzuela Post Office', 'IT Support', 'IT Concerns', 'Sample ticket 99 for it concerns in IT Support', 'completed', 'emily.davis@postoffice.com', '2026-01-12 18:45:06', '2026-01-15 01:01:04', '2026-01-11 19:01:23', '2026-01-11 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(100, 'T700100', 'Grace Wilson', 'grace.wilson@example.com', 'Marikina Central Post Office', 'Mail Services', 'IT Concerns', 'Sample ticket 100 for it concerns in Mail Services', 'completed', 'sarah.johnson@postoffice.com', '2026-02-17 08:32:24', '2026-02-22 23:34:16', '2026-02-16 19:01:23', '2026-02-16 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(101, 'T700101', 'Jack Thomas', 'jack.thomas@example.com', 'San Juan Central Post Office', 'Parcel Services', 'Accounting Concerns', 'Sample ticket 101 for accounting concerns in Parcel Services', 'completed', 'sarah.johnson@postoffice.com', '2026-02-11 09:49:02', '2026-02-16 19:39:41', '2026-02-10 19:01:23', '2026-02-10 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(102, 'T700102', 'Emma Davis', 'emma.davis@example.com', 'Makati Central Post Office', 'Accounting', 'Administrative Concerns', 'Sample ticket 102 for administrative concerns in Accounting', 'completed', 'michael.brown@postoffice.com', '2026-02-06 10:34:31', '2026-02-08 05:08:31', '2026-02-05 19:01:23', '2026-02-05 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(103, 'T700103', 'Ivy Anderson', 'ivy.anderson@example.com', 'Caloocan Central Post Office', 'Mail Services', 'Administrative Concerns', 'Sample ticket 103 for administrative concerns in Mail Services', 'awaitingapproval', 'sarah.johnson@postoffice.com', '2025-12-18 14:11:12', NULL, '2025-12-17 19:01:23', '2025-12-17 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(104, 'T700104', 'Henry Taylor', 'henry.taylor@example.com', 'San Juan Central Post Office', 'Customer Service', 'Human Resource Concerns', 'Sample ticket 104 for human resource concerns in Customer Service', 'completed', 'david.wilson@postoffice.com', '2025-12-28 14:46:43', '2026-01-03 10:27:59', '2025-12-27 19:01:23', '2025-12-27 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(105, 'T700105', 'Emma Davis', 'emma.davis@example.com', 'Paranaque Post Office', 'Mail Services', 'IT Concerns', 'Sample ticket 105 for it concerns in Mail Services', 'awaitingapproval', 'john.smith@postoffice.com', '2026-01-16 04:52:31', NULL, '2026-01-15 19:01:23', '2026-01-15 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(106, 'T700106', 'Grace Wilson', 'grace.wilson@example.com', 'Marikina Central Post Office', 'Accounting', 'IT Concerns', 'Sample ticket 106 for it concerns in Accounting', 'pending', NULL, NULL, NULL, '2026-01-18 19:01:23', '2026-01-18 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(107, 'T700107', 'Frank Miller', 'frank.miller@example.com', 'Pateros Post Office', 'Customer Service', 'IT Concerns', 'Sample ticket 107 for it concerns in Customer Service', 'completed', 'emily.davis@postoffice.com', '2026-01-31 01:58:12', '2026-01-31 23:30:38', '2026-01-30 19:01:23', '2026-01-30 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(108, 'T700108', 'Henry Taylor', 'henry.taylor@example.com', 'Marikina Central Post Office', 'IT Support', 'Human Resource Concerns', 'Sample ticket 108 for human resource concerns in IT Support', 'awaitingapproval', 'sarah.johnson@postoffice.com', '2025-12-17 20:02:57', NULL, '2025-12-17 19:01:23', '2025-12-17 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(109, 'T700109', 'Grace Wilson', 'grace.wilson@example.com', 'Caloocan Central Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 109 for accounting concerns in Accounting', 'inprogress', 'john.smith@postoffice.com', '2026-01-07 01:12:57', NULL, '2026-01-06 19:01:23', '2026-01-06 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(110, 'T700110', 'David Brown', 'david.brown@example.com', 'Paranaque Post Office', 'Customer Service', 'Operational Concerns', 'Sample ticket 110 for operational concerns in Customer Service', 'completed', 'emily.davis@postoffice.com', '2026-02-24 03:11:58', '2026-02-26 09:22:18', '2026-02-23 19:01:23', '2026-02-23 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(111, 'T700111', 'Carol Williams', 'carol.williams@example.com', 'San Juan Central Post Office', 'IT Support', 'Operational Concerns', 'Sample ticket 111 for operational concerns in IT Support', 'inprogress', 'john.smith@postoffice.com', '2026-03-08 14:13:18', NULL, '2026-03-07 19:01:23', '2026-03-07 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(112, 'T700112', 'Jack Thomas', 'jack.thomas@example.com', 'San Juan Central Post Office', 'Customer Service', 'Human Resource Concerns', 'Sample ticket 112 for human resource concerns in Customer Service', 'completed', 'michael.brown@postoffice.com', '2026-01-21 16:59:36', '2026-01-22 09:58:14', '2026-01-20 19:01:23', '2026-01-20 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(113, 'T700113', 'David Brown', 'david.brown@example.com', 'Manila Central Post Office', 'Mail Services', 'Human Resource Concerns', 'Sample ticket 113 for human resource concerns in Mail Services', 'completed', 'john.smith@postoffice.com', '2026-03-04 22:52:58', '2026-03-06 03:39:40', '2026-03-04 19:01:23', '2026-03-04 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(114, 'T700114', 'David Brown', 'david.brown@example.com', 'Pateros Post Office', 'IT Support', 'Human Resource Concerns', 'Sample ticket 114 for human resource concerns in IT Support', 'pending', NULL, NULL, NULL, '2026-01-29 19:01:23', '2026-01-29 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(115, 'T700115', 'Ivy Anderson', 'ivy.anderson@example.com', 'Caloocan Central Post Office', 'Parcel Services', 'Operational Concerns', 'Sample ticket 115 for operational concerns in Parcel Services', 'completed', 'emily.davis@postoffice.com', '2026-01-13 08:15:03', '2026-01-19 10:10:20', '2026-01-12 19:01:23', '2026-01-12 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(116, 'T700116', 'Grace Wilson', 'grace.wilson@example.com', 'Taguig Post Office', 'IT Support', 'Administrative Concerns', 'Sample ticket 116 for administrative concerns in IT Support', 'inprogress', 'sarah.johnson@postoffice.com', '2025-12-25 16:43:01', NULL, '2025-12-24 19:01:23', '2025-12-24 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(117, 'T700117', 'David Brown', 'david.brown@example.com', 'Marikina Central Post Office', 'IT Support', 'Administrative Concerns', 'Sample ticket 117 for administrative concerns in IT Support', 'awaitingapproval', 'david.wilson@postoffice.com', '2026-01-09 02:26:43', NULL, '2026-01-08 19:01:23', '2026-01-08 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(118, 'T700118', 'Grace Wilson', 'grace.wilson@example.com', 'Manila Central Post Office', 'Mail Services', 'IT Concerns', 'Sample ticket 118 for it concerns in Mail Services', 'awaitingapproval', 'john.smith@postoffice.com', '2026-02-21 05:14:18', NULL, '2026-02-20 19:01:23', '2026-02-20 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(119, 'T700119', 'Ivy Anderson', 'ivy.anderson@example.com', 'Quezon City Central Post Office', 'Mail Services', 'Administrative Concerns', 'Sample ticket 119 for administrative concerns in Mail Services', 'awaitingapproval', 'michael.brown@postoffice.com', '2026-01-13 09:09:43', NULL, '2026-01-12 19:01:23', '2026-01-12 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(120, 'T700120', 'Grace Wilson', 'grace.wilson@example.com', 'Quezon City Central Post Office', 'Mail Services', 'IT Concerns', 'Sample ticket 120 for it concerns in Mail Services', 'awaitingapproval', 'david.wilson@postoffice.com', '2026-02-05 12:10:57', NULL, '2026-02-04 19:01:23', '2026-02-04 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(121, 'T700121', 'David Brown', 'david.brown@example.com', 'Valenzuela Post Office', 'Mail Services', 'IT Concerns', 'Sample ticket 121 for it concerns in Mail Services', 'completed', NULL, NULL, NULL, '2025-12-20 19:01:23', '2026-03-25 02:45:14', NULL, NULL, 'Swabe Edrian', '2026-03-17 00:01:41', NULL, NULL, NULL),
(122, 'T700122', 'Alice Johnson', 'alice.johnson@example.com', 'Makati Central Post Office', 'Mail Services', 'Human Resource Concerns', 'Sample ticket 122 for human resource concerns in Mail Services', 'inprogress', 'sarah.johnson@postoffice.com', '2026-01-25 16:49:00', NULL, '2026-01-24 19:01:23', '2026-01-24 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(123, 'T700123', 'Alice Johnson', 'alice.johnson@example.com', 'Manila Central Post Office', 'Customer Service', 'Operational Concerns', 'Sample ticket 123 for operational concerns in Customer Service', 'pending', NULL, NULL, NULL, '2026-01-07 19:01:23', '2026-01-07 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(124, 'T700124', 'Bob Smith', 'bob.smith@example.com', 'Taguig Post Office', 'IT Support', 'Human Resource Concerns', 'Sample ticket 124 for human resource concerns in IT Support', 'awaitingapproval', 'sarah.johnson@postoffice.com', '2026-02-15 18:49:37', NULL, '2026-02-14 19:01:23', '2026-02-14 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(125, 'T700125', 'Carol Williams', 'carol.williams@example.com', 'San Juan Central Post Office', 'Parcel Services', 'IT Concerns', 'Sample ticket 125 for it concerns in Parcel Services', 'completed', 'emily.davis@postoffice.com', '2026-01-25 04:53:34', '2026-01-31 08:57:15', '2026-01-24 19:01:23', '2026-01-24 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(126, 'T700126', 'Ivy Anderson', 'ivy.anderson@example.com', 'Makati Central Post Office', 'Mail Services', 'Accounting Concerns', 'Sample ticket 126 for accounting concerns in Mail Services', 'completed', 'sarah.johnson@postoffice.com', '2026-03-10 10:00:22', '2026-03-16 12:39:58', '2026-03-09 19:01:23', '2026-03-09 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(127, 'T700127', 'Bob Smith', 'bob.smith@example.com', 'Pasay City Post Office', 'Mail Services', 'Operational Concerns', 'Sample ticket 127 for operational concerns in Mail Services', 'completed', 'emily.davis@postoffice.com', '2026-03-14 05:02:12', '2026-03-16 13:10:21', '2026-03-13 19:01:23', '2026-03-13 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(128, 'T700128', 'Frank Miller', 'frank.miller@example.com', 'Pateros Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 128 for accounting concerns in Accounting', 'completed', 'sarah.johnson@postoffice.com', '2025-12-21 07:57:51', '2025-12-24 18:01:18', '2025-12-20 19:01:23', '2025-12-20 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(129, 'T700129', 'Grace Wilson', 'grace.wilson@example.com', 'Valenzuela Post Office', 'Parcel Services', 'IT Concerns', 'Sample ticket 129 for it concerns in Parcel Services', 'completed', 'david.wilson@postoffice.com', '2026-01-13 18:36:52', '2026-01-18 12:09:38', '2026-01-12 19:01:23', '2026-01-12 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(130, 'T700130', 'David Brown', 'david.brown@example.com', 'Valenzuela Post Office', 'Accounting', 'Human Resource Concerns', 'Sample ticket 130 for human resource concerns in Accounting', 'completed', 'sarah.johnson@postoffice.com', '2025-12-21 01:58:14', '2025-12-21 15:38:01', '2025-12-20 19:01:23', '2025-12-20 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(131, 'T700131', 'Ivy Anderson', 'ivy.anderson@example.com', 'Manila Central Post Office', 'IT Support', 'Operational Concerns', 'Sample ticket 131 for operational concerns in IT Support', 'inprogress', 'michael.brown@postoffice.com', '2026-03-16 18:07:22', NULL, '2026-03-15 19:01:23', '2026-03-15 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(132, 'T700132', 'Frank Miller', 'frank.miller@example.com', 'Marikina Central Post Office', 'IT Support', 'Accounting Concerns', 'Sample ticket 132 for accounting concerns in IT Support', 'pending', NULL, NULL, NULL, '2026-02-09 19:01:23', '2026-02-09 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(133, 'T700133', 'David Brown', 'david.brown@example.com', 'San Juan Central Post Office', 'Accounting', 'Operational Concerns', 'Sample ticket 133 for operational concerns in Accounting', 'inprogress', 'emily.davis@postoffice.com', '2026-02-23 19:46:30', NULL, '2026-02-23 19:01:23', '2026-02-23 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(134, 'T700134', 'Ivy Anderson', 'ivy.anderson@example.com', 'Manila Central Post Office', 'Accounting', 'IT Concerns', 'Sample ticket 134 for it concerns in Accounting', 'pending', NULL, NULL, NULL, '2026-01-09 19:01:23', '2026-01-09 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(135, 'T700135', 'David Brown', 'david.brown@example.com', 'Marikina Central Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 135 for accounting concerns in Accounting', 'completed', 'michael.brown@postoffice.com', '2026-02-06 05:59:06', '2026-02-09 01:36:47', '2026-02-05 19:01:23', '2026-02-05 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(136, 'T700136', 'Frank Miller', 'frank.miller@example.com', 'Taguig Post Office', 'Parcel Services', 'IT Concerns', 'Sample ticket 136 for it concerns in Parcel Services', 'completed', NULL, NULL, NULL, '2025-12-20 19:01:23', '2026-03-23 02:21:45', NULL, NULL, 'Swabe Edrian', '2026-03-17 00:01:05', NULL, NULL, NULL),
(137, 'T700137', 'Grace Wilson', 'grace.wilson@example.com', 'Pasay City Post Office', 'Mail Services', 'Operational Concerns', 'Sample ticket 137 for operational concerns in Mail Services', 'completed', 'david.wilson@postoffice.com', '2026-02-16 08:53:01', '2026-02-19 01:58:43', '2026-02-15 19:01:23', '2026-02-15 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(138, 'T700138', 'Henry Taylor', 'henry.taylor@example.com', 'Las Piñas Post office', 'Mail Services', 'Human Resource Concerns', 'Sample ticket 138 for human resource concerns in Mail Services', 'awaitingapproval', 'emily.davis@postoffice.com', '2026-01-31 10:20:27', NULL, '2026-01-30 19:01:23', '2026-01-30 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(139, 'T700139', 'Henry Taylor', 'henry.taylor@example.com', 'Quezon City Central Post Office', 'Customer Service', 'IT Concerns', 'Sample ticket 139 for it concerns in Customer Service', 'pending', NULL, NULL, NULL, '2026-03-10 19:01:23', '2026-03-10 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(140, 'T700140', 'Emma Davis', 'emma.davis@example.com', 'Marikina Central Post Office', 'Customer Service', 'Operational Concerns', 'Sample ticket 140 for operational concerns in Customer Service', 'inprogress', 'john.smith@postoffice.com', '2026-01-28 08:50:29', NULL, '2026-01-27 19:01:23', '2026-01-27 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(141, 'T700141', 'Emma Davis', 'emma.davis@example.com', 'Makati Central Post Office', 'Parcel Services', 'Operational Concerns', 'Sample ticket 141 for operational concerns in Parcel Services', 'completed', 'emily.davis@postoffice.com', '2026-01-26 00:18:40', '2026-01-28 15:41:22', '2026-01-25 19:01:23', '2026-01-25 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(142, 'T700142', 'Grace Wilson', 'grace.wilson@example.com', 'Pateros Post Office', 'Customer Service', 'Accounting Concerns', 'Sample ticket 142 for accounting concerns in Customer Service', 'completed', 'michael.brown@postoffice.com', '2026-02-03 03:24:27', '2026-02-04 11:17:16', '2026-02-02 19:01:23', '2026-02-02 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `tickets` (`id`, `ticket_number`, `customer_name`, `email`, `branch`, `department`, `category`, `description`, `status`, `accepted_by`, `accepted_at`, `completed_at`, `created_at`, `updated_at`, `remarks`, `ticker`, `acceptedBy`, `acceptedAt`, `completedAt`, `ticketId`, `customerName`) VALUES
(143, 'T700143', 'Grace Wilson', 'grace.wilson@example.com', 'Caloocan Central Post Office', 'IT Support', 'Administrative Concerns', 'Sample ticket 143 for administrative concerns in IT Support', 'completed', 'john.smith@postoffice.com', '2026-03-12 12:44:21', '2026-03-17 00:04:31', '2026-03-11 19:01:23', '2026-03-11 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(144, 'T700144', 'David Brown', 'david.brown@example.com', 'San Juan Central Post Office', 'Customer Service', 'Accounting Concerns', 'Sample ticket 144 for accounting concerns in Customer Service', 'inprogress', 'david.wilson@postoffice.com', '2026-01-09 00:37:54', NULL, '2026-01-08 19:01:23', '2026-01-08 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(145, 'T700145', 'Emma Davis', 'emma.davis@example.com', 'San Juan Central Post Office', 'Mail Services', 'IT Concerns', 'Sample ticket 145 for it concerns in Mail Services', 'completed', 'sarah.johnson@postoffice.com', '2026-02-14 09:37:55', '2026-02-18 20:12:11', '2026-02-13 19:01:23', '2026-02-13 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(146, 'T700146', 'David Brown', 'david.brown@example.com', 'Taguig Post Office', 'Accounting', 'Human Resource Concerns', 'Sample ticket 146 for human resource concerns in Accounting', 'inprogress', 'john.smith@postoffice.com', '2026-03-01 09:48:16', NULL, '2026-02-28 19:01:23', '2026-02-28 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(147, 'T700147', 'Bob Smith', 'bob.smith@example.com', 'Manila Central Post Office', 'Customer Service', 'IT Concerns', 'Sample ticket 147 for it concerns in Customer Service', 'completed', 'david.wilson@postoffice.com', '2026-01-19 00:11:02', '2026-01-21 03:04:35', '2026-01-18 19:01:23', '2026-01-18 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(148, 'T700148', 'Frank Miller', 'frank.miller@example.com', 'Valenzuela Post Office', 'Customer Service', 'Operational Concerns', 'Sample ticket 148 for operational concerns in Customer Service', 'awaitingapproval', 'emily.davis@postoffice.com', '2026-03-15 12:23:41', NULL, '2026-03-14 19:01:23', '2026-03-14 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(149, 'T700149', 'Henry Taylor', 'henry.taylor@example.com', 'Quezon City Central Post Office', 'IT Support', 'Operational Concerns', 'Sample ticket 149 for operational concerns in IT Support', 'pending', NULL, NULL, NULL, '2026-03-03 19:01:23', '2026-03-03 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(150, 'T700150', 'Jack Thomas', 'jack.thomas@example.com', 'Marikina Central Post Office', 'IT Support', 'IT Concerns', 'Sample ticket 150 for it concerns in IT Support', 'inprogress', 'Swabe Edrian', '2026-03-29 21:33:32', NULL, '2026-01-09 19:01:23', '2026-03-30 05:33:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(151, 'T700151', 'Emma Davis', 'emma.davis@example.com', 'Taguig Post Office', 'IT Support', 'Human Resource Concerns', 'Sample ticket 151 for human resource concerns in IT Support', 'awaitingapproval', 'david.wilson@postoffice.com', '2025-12-31 13:45:43', NULL, '2025-12-30 19:01:23', '2025-12-30 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(152, 'T700152', 'Emma Davis', 'emma.davis@example.com', 'San Juan Central Post Office', 'Mail Services', 'Accounting Concerns', 'Sample ticket 152 for accounting concerns in Mail Services', 'inprogress', 'michael.brown@postoffice.com', '2026-01-30 09:29:17', NULL, '2026-01-29 19:01:23', '2026-01-29 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(153, 'T700153', 'Bob Smith', 'bob.smith@example.com', 'Pateros Post Office', 'Customer Service', 'Administrative Concerns', 'Sample ticket 153 for administrative concerns in Customer Service', 'awaitingapproval', 'david.wilson@postoffice.com', '2026-01-24 20:52:46', NULL, '2026-01-24 19:01:23', '2026-01-24 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(154, 'T700154', 'Grace Wilson', 'grace.wilson@example.com', 'Pasay City Post Office', 'Parcel Services', 'Operational Concerns', 'Sample ticket 154 for operational concerns in Parcel Services', 'pending', NULL, NULL, NULL, '2026-03-07 19:01:23', '2026-03-07 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(155, 'T700155', 'Jack Thomas', 'jack.thomas@example.com', 'Pateros Post Office', 'IT Support', 'Accounting Concerns', 'Sample ticket 155 for accounting concerns in IT Support', 'completed', 'michael.brown@postoffice.com', '2026-03-03 00:03:18', '2026-03-05 11:46:35', '2026-03-02 19:01:23', '2026-03-02 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(156, 'T700156', 'Alice Johnson', 'alice.johnson@example.com', 'Pateros Post Office', 'Mail Services', 'IT Concerns', 'Sample ticket 156 for it concerns in Mail Services', 'completed', 'sarah.johnson@postoffice.com', '2026-03-16 10:12:47', '2026-03-20 05:21:34', '2026-03-15 19:01:23', '2026-03-15 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(157, 'T700157', 'David Brown', 'david.brown@example.com', 'Pateros Post Office', 'Mail Services', 'Accounting Concerns', 'Sample ticket 157 for accounting concerns in Mail Services', 'completed', 'david.wilson@postoffice.com', '2026-01-19 15:05:15', '2026-01-21 20:00:45', '2026-01-18 19:01:23', '2026-01-18 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(158, 'T700158', 'Jack Thomas', 'jack.thomas@example.com', 'Manila Central Post Office', 'Parcel Services', 'Human Resource Concerns', 'Sample ticket 158 for human resource concerns in Parcel Services', 'completed', 'john.smith@postoffice.com', '2025-12-27 13:08:37', '2026-01-02 21:35:49', '2025-12-26 19:01:23', '2025-12-26 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(159, 'T700159', 'Bob Smith', 'bob.smith@example.com', 'Taguig Post Office', 'Parcel Services', 'Accounting Concerns', 'Sample ticket 159 for accounting concerns in Parcel Services', 'inprogress', NULL, NULL, NULL, '2025-12-29 19:01:23', '2026-03-24 04:30:06', NULL, NULL, 'Sarah Johnson', '2026-03-23 20:30:06', NULL, NULL, NULL),
(160, 'T700160', 'Frank Miller', 'frank.miller@example.com', 'Quezon City Central Post Office', 'IT Support', 'Accounting Concerns', 'Sample ticket 160 for accounting concerns in IT Support', 'completed', 'john.smith@postoffice.com', '2026-03-02 19:41:55', '2026-03-03 04:28:18', '2026-03-02 19:01:23', '2026-03-02 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(161, 'T700161', 'David Brown', 'david.brown@example.com', 'Valenzuela Post Office', 'Customer Service', 'Human Resource Concerns', 'Sample ticket 161 for human resource concerns in Customer Service', 'awaitingapproval', 'michael.brown@postoffice.com', '2026-01-23 04:24:01', NULL, '2026-01-22 19:01:23', '2026-01-22 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(162, 'T700162', 'Frank Miller', 'frank.miller@example.com', 'Marikina Central Post Office', 'IT Support', 'Administrative Concerns', 'Sample ticket 162 for administrative concerns in IT Support', 'awaitingapproval', 'emily.davis@postoffice.com', '2026-03-01 23:31:07', NULL, '2026-03-01 19:01:23', '2026-03-01 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(163, 'T700163', 'Emma Davis', 'emma.davis@example.com', 'Pateros Post Office', 'Mail Services', 'Accounting Concerns', 'Sample ticket 163 for accounting concerns in Mail Services', 'inprogress', 'michael.brown@postoffice.com', '2026-02-07 08:47:56', NULL, '2026-02-06 19:01:23', '2026-02-06 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(164, 'T700164', 'Frank Miller', 'frank.miller@example.com', 'Taguig Post Office', 'Customer Service', 'Operational Concerns', 'Sample ticket 164 for operational concerns in Customer Service', 'pending', NULL, NULL, NULL, '2026-03-12 19:01:23', '2026-03-12 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(165, 'T700165', 'David Brown', 'david.brown@example.com', 'Makati Central Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 165 for accounting concerns in Accounting', 'completed', 'John Smith', '2026-03-29 18:23:20', NULL, '2025-12-18 19:01:23', '2026-03-30 07:54:17', 'testtest', NULL, NULL, NULL, NULL, NULL, NULL),
(166, 'T700166', 'Emma Davis', 'emma.davis@example.com', 'Marikina Central Post Office', 'Mail Services', 'Administrative Concerns', 'Sample ticket 166 for administrative concerns in Mail Services', 'completed', 'sarah.johnson@postoffice.com', '2026-02-17 01:51:53', '2026-02-20 07:19:47', '2026-02-16 19:01:23', '2026-02-16 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(167, 'T700167', 'Bob Smith', 'bob.smith@example.com', 'Las Piñas Post office', 'Accounting', 'Accounting Concerns', 'Sample ticket 167 for accounting concerns in Accounting', 'inprogress', 'emily.davis@postoffice.com', '2026-01-12 15:35:48', NULL, '2026-01-11 19:01:23', '2026-01-11 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(168, 'T700168', 'Jack Thomas', 'jack.thomas@example.com', 'Pateros Post Office', 'Customer Service', 'Operational Concerns', 'Sample ticket 168 for operational concerns in Customer Service', 'awaitingapproval', 'emily.davis@postoffice.com', '2026-02-12 11:06:20', NULL, '2026-02-11 19:01:23', '2026-02-11 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(169, 'T700169', 'Carol Williams', 'carol.williams@example.com', 'Marikina Central Post Office', 'IT Support', 'Operational Concerns', 'Sample ticket 169 for operational concerns in IT Support', 'completed', 'emily.davis@postoffice.com', '2026-01-13 00:40:52', '2026-01-14 22:01:25', '2026-01-12 19:01:23', '2026-01-12 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(170, 'T700170', 'Carol Williams', 'carol.williams@example.com', 'Quezon City Central Post Office', 'Parcel Services', 'Human Resource Concerns', 'Sample ticket 170 for human resource concerns in Parcel Services', 'pending', NULL, NULL, NULL, '2026-02-13 19:01:23', '2026-02-13 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(171, 'T700171', 'Frank Miller', 'frank.miller@example.com', 'Pateros Post Office', 'Accounting', 'Human Resource Concerns', 'Sample ticket 171 for human resource concerns in Accounting', 'awaitingapproval', 'michael.brown@postoffice.com', '2026-03-09 21:11:22', NULL, '2026-03-09 19:01:23', '2026-03-09 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(172, 'T700172', 'David Brown', 'david.brown@example.com', 'Manila Central Post Office', 'Customer Service', 'Operational Concerns', 'Sample ticket 172 for operational concerns in Customer Service', 'awaitingapproval', 'michael.brown@postoffice.com', '2026-02-12 02:16:22', NULL, '2026-02-11 19:01:23', '2026-02-11 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(173, 'T700173', 'Bob Smith', 'bob.smith@example.com', 'Paranaque Post Office', 'Customer Service', 'IT Concerns', 'Sample ticket 173 for it concerns in Customer Service', 'completed', 'sarah.johnson@postoffice.com', '2026-02-21 07:28:25', '2026-02-27 08:56:38', '2026-02-20 19:01:23', '2026-02-20 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(174, 'T700174', 'Ivy Anderson', 'ivy.anderson@example.com', 'Las Piñas Post office', 'Mail Services', 'Accounting Concerns', 'Sample ticket 174 for accounting concerns in Mail Services', 'awaitingapproval', 'emily.davis@postoffice.com', '2025-12-31 01:04:58', NULL, '2025-12-30 19:01:23', '2025-12-30 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(175, 'T700175', 'David Brown', 'david.brown@example.com', 'Caloocan Central Post Office', 'Customer Service', 'Human Resource Concerns', 'Sample ticket 175 for human resource concerns in Customer Service', 'inprogress', 'sarah.johnson@postoffice.com', '2025-12-24 08:45:46', NULL, '2025-12-23 19:01:23', '2025-12-23 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(176, 'T700176', 'Grace Wilson', 'grace.wilson@example.com', 'Caloocan Central Post Office', 'Customer Service', 'Operational Concerns', 'Sample ticket 176 for operational concerns in Customer Service', 'inprogress', 'michael.brown@postoffice.com', '2026-02-25 15:41:55', NULL, '2026-02-24 19:01:23', '2026-02-24 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(177, 'T700177', 'Bob Smith', 'bob.smith@example.com', 'Marikina Central Post Office', 'Customer Service', 'Human Resource Concerns', 'Sample ticket 177 for human resource concerns in Customer Service', 'awaitingapproval', 'john.smith@postoffice.com', '2026-01-09 17:20:38', NULL, '2026-01-08 19:01:23', '2026-01-08 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(178, 'T700178', 'Frank Miller', 'frank.miller@example.com', 'Las Piñas Post office', 'IT Support', 'Administrative Concerns', 'Sample ticket 178 for administrative concerns in IT Support', 'pending', NULL, NULL, NULL, '2026-02-04 19:01:23', '2026-02-04 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(179, 'T700179', 'Ivy Anderson', 'ivy.anderson@example.com', 'Quezon City Central Post Office', 'Parcel Services', 'Administrative Concerns', 'Sample ticket 179 for administrative concerns in Parcel Services', 'inprogress', 'michael.brown@postoffice.com', '2026-02-19 01:43:57', NULL, '2026-02-18 19:01:23', '2026-02-18 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(180, 'T700180', 'Carol Williams', 'carol.williams@example.com', 'Manila Central Post Office', 'IT Support', 'IT Concerns', 'Sample ticket 180 for it concerns in IT Support', 'awaitingapproval', 'emily.davis@postoffice.com', '2026-02-04 13:23:29', NULL, '2026-02-03 19:01:23', '2026-02-03 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(181, 'T700181', 'Emma Davis', 'emma.davis@example.com', 'Pateros Post Office', 'Mail Services', 'Operational Concerns', 'Sample ticket 181 for operational concerns in Mail Services', 'completed', 'emily.davis@postoffice.com', '2025-12-26 16:13:16', '2025-12-30 02:44:52', '2025-12-25 19:01:23', '2025-12-25 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(182, 'T700182', 'Bob Smith', 'bob.smith@example.com', 'Taguig Post Office', 'Customer Service', 'Accounting Concerns', 'Sample ticket 182 for accounting concerns in Customer Service', 'completed', 'sarah.johnson@postoffice.com', '2026-02-09 14:17:44', '2026-02-12 06:24:13', '2026-02-08 19:01:23', '2026-02-08 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(183, 'T700183', 'Ivy Anderson', 'ivy.anderson@example.com', 'Pasay City Post Office', 'IT Support', 'Accounting Concerns', 'Sample ticket 183 for accounting concerns in IT Support', 'inprogress', 'michael.brown@postoffice.com', '2025-12-22 20:07:43', NULL, '2025-12-22 19:01:23', '2025-12-22 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(184, 'T700184', 'Bob Smith', 'bob.smith@example.com', 'Quezon City Central Post Office', 'IT Support', 'Administrative Concerns', 'Sample ticket 184 for administrative concerns in IT Support', 'pending', NULL, NULL, NULL, '2026-03-13 19:01:23', '2026-03-13 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(185, 'T700185', 'Grace Wilson', 'grace.wilson@example.com', 'Quezon City Central Post Office', 'Accounting', 'Operational Concerns', 'Sample ticket 185 for operational concerns in Accounting', 'awaitingapproval', 'emily.davis@postoffice.com', '2025-12-28 04:17:53', NULL, '2025-12-27 19:01:23', '2025-12-27 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(186, 'T700186', 'David Brown', 'david.brown@example.com', 'Taguig Post Office', 'Customer Service', 'Human Resource Concerns', 'Sample ticket 186 for human resource concerns in Customer Service', 'completed', 'david.wilson@postoffice.com', '2025-12-27 17:33:12', '2025-12-31 04:36:33', '2025-12-26 19:01:23', '2025-12-26 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(187, 'T700187', 'Emma Davis', 'emma.davis@example.com', 'Manila Central Post Office', 'IT Support', 'Accounting Concerns', 'Sample ticket 187 for accounting concerns in IT Support', 'completed', 'michael.brown@postoffice.com', '2026-02-20 23:26:56', '2026-02-26 02:00:13', '2026-02-20 19:01:23', '2026-02-20 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(188, 'T700188', 'Henry Taylor', 'henry.taylor@example.com', 'Manila Central Post Office', 'Parcel Services', 'Administrative Concerns', 'Sample ticket 188 for administrative concerns in Parcel Services', 'completed', 'emily.davis@postoffice.com', '2026-02-18 02:33:55', '2026-02-20 17:16:05', '2026-02-17 19:01:23', '2026-02-17 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(189, 'T700189', 'Emma Davis', 'emma.davis@example.com', 'San Juan Central Post Office', 'Mail Services', 'Operational Concerns', 'Sample ticket 189 for operational concerns in Mail Services', 'inprogress', 'john.smith@postoffice.com', '2026-02-03 20:12:05', NULL, '2026-02-03 19:01:23', '2026-02-03 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(190, 'T700190', 'Grace Wilson', 'grace.wilson@example.com', 'Pasay City Post Office', 'Parcel Services', 'Operational Concerns', 'Sample ticket 190 for operational concerns in Parcel Services', 'completed', 'sarah.johnson@postoffice.com', '2026-02-22 22:23:45', '2026-02-28 05:18:14', '2026-02-22 19:01:23', '2026-02-22 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(191, 'T700191', 'David Brown', 'david.brown@example.com', 'Taguig Post Office', 'IT Support', 'Administrative Concerns', 'Sample ticket 191 for administrative concerns in IT Support', 'completed', 'sarah.johnson@postoffice.com', '2025-12-30 14:00:58', '2026-01-05 15:33:17', '2025-12-29 19:01:23', '2025-12-29 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(192, 'T700192', 'Jack Thomas', 'jack.thomas@example.com', 'Valenzuela Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 192 for accounting concerns in Accounting', 'completed', 'sarah.johnson@postoffice.com', '2026-01-25 08:39:47', '2026-01-29 03:36:15', '2026-01-24 19:01:23', '2026-01-24 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(193, 'T700193', 'Frank Miller', 'frank.miller@example.com', 'Manila Central Post Office', 'Parcel Services', 'IT Concerns', 'Sample ticket 193 for it concerns in Parcel Services', 'completed', 'john.smith@postoffice.com', '2026-01-16 22:20:24', '2026-01-21 12:12:36', '2026-01-16 19:01:23', '2026-01-16 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(194, 'T700194', 'Jack Thomas', 'jack.thomas@example.com', 'Caloocan Central Post Office', 'Accounting', 'Human Resource Concerns', 'Sample ticket 194 for human resource concerns in Accounting', 'pending', NULL, NULL, NULL, '2026-01-16 19:01:23', '2026-01-16 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(195, 'T700195', 'Frank Miller', 'frank.miller@example.com', 'Marikina Central Post Office', 'Accounting', 'Accounting Concerns', 'Sample ticket 195 for accounting concerns in Accounting', 'completed', 'sarah.johnson@postoffice.com', '2026-03-13 22:04:54', '2026-03-14 20:51:09', '2026-03-13 19:01:23', '2026-03-13 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(196, 'T700196', 'Jack Thomas', 'jack.thomas@example.com', 'Taguig Post Office', 'Mail Services', 'Operational Concerns', 'Sample ticket 196 for operational concerns in Mail Services', 'completed', 'emily.davis@postoffice.com', '2026-03-17 08:33:02', '2026-03-19 22:58:53', '2026-03-16 19:01:23', '2026-03-16 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(197, 'T700197', 'Grace Wilson', 'grace.wilson@example.com', 'Quezon City Central Post Office', 'IT Support', 'Accounting Concerns', 'Sample ticket 197 for accounting concerns in IT Support', 'inprogress', 'John Smith', '2026-03-24 19:37:26', NULL, '2026-01-05 19:01:23', '2026-03-25 03:37:26', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(198, 'T700198', 'Carol Williams', 'carol.williams@example.com', 'Caloocan Central Post Office', 'Mail Services', 'Administrative Concerns', 'Sample ticket 198 for administrative concerns in Mail Services', 'awaitingapproval', 'john.smith@postoffice.com', '2026-01-01 15:50:31', NULL, '2025-12-31 19:01:23', '2025-12-31 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(199, 'T700199', 'Jack Thomas', 'jack.thomas@example.com', 'Makati Central Post Office', 'Mail Services', 'Operational Concerns', 'Sample ticket 199 for operational concerns in Mail Services', 'awaitingapproval', 'sarah.johnson@postoffice.com', '2025-12-24 15:51:37', NULL, '2025-12-23 19:01:23', '2025-12-23 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(200, 'T700200', 'Alice Johnson', 'alice.johnson@example.com', 'Pateros Post Office', 'IT Support', 'Operational Concerns', 'Sample ticket 200 for operational concerns in IT Support', 'inprogress', 'john.smith@postoffice.com', '2026-01-04 22:02:03', NULL, '2026-01-04 19:01:23', '2026-01-04 19:01:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(201, 'T333952', '', 'gutierrezdave61@gmail.com', 'Caloocan Central Post Office', 'Accounting', 'Accounting Concerns - Invoices', 'test ticket', 'pending', NULL, NULL, NULL, '2026-03-23 08:42:14', '2026-03-23 08:42:14', NULL, 'TK333954', NULL, NULL, NULL, 'T333952', 'edrian edi'),
(202, 'T542400', '', 'gutierrezdave61@gmail.com', 'Las Piñas Post Office', 'Marketing', 'IT Concerns - Hardware', 'testtesttesttest', 'completed', NULL, NULL, NULL, '2026-03-24 05:02:22', '2026-03-25 02:45:05', NULL, 'TK542401', 'Swabe Edrian', '2026-03-23 21:04:02', NULL, 'T542400', 'test test'),
(203, 'T126176', 'John Doe', 'john.doe@example.com', 'Main', 'IT', '', 'Test issue', 'pending', NULL, NULL, NULL, '2026-03-24 05:28:46', '2026-03-24 05:28:46', NULL, 'TK126177', NULL, NULL, NULL, NULL, NULL),
(204, 'T123456', 'John Doe', 'john.doe@example.com', 'Main', 'IT', 'IT Concerns', 'Test issue', 'completed', 'Swabe Edrian', '2026-03-23 21:52:53', NULL, '2026-03-24 05:46:11', '2026-03-25 02:45:13', NULL, 'TK123456', NULL, NULL, NULL, NULL, NULL),
(205, 'T264459', 'John Doe', 'john.doe@example.com', 'Main', 'IT', 'IT Concerns', 'Test issue', 'completed', 'Swabe Edrian', '2026-03-24 18:37:19', NULL, '2026-03-24 05:47:44', '2026-03-25 02:45:12', NULL, 'TK264459', NULL, NULL, NULL, NULL, NULL),
(206, 'T471299', 'jeydi dj', 'gutierrezdave61@gmail.com', 'Quezon City Central Post Office', 'Accounting', 'IT Concerns - Hardware', 'sample ticket', 'completed', 'Swabe Edrian', '2026-03-23 21:52:34', NULL, '2026-03-24 05:51:11', '2026-03-25 02:44:04', NULL, 'TK471299', NULL, NULL, NULL, NULL, NULL),
(207, 'T389400', 'sample ticket', 'gutierrezdave61@gmail.com', 'Makati Central Post Office', 'Human Resource', 'IT Concerns - Software', '2 sample ticket', 'pending', NULL, NULL, NULL, '2026-03-25 02:39:49', '2026-03-25 02:39:49', NULL, 'TK389401', NULL, NULL, NULL, NULL, NULL),
(208, 'T933787', '1 2', 'gutierrezdave61@gmail.com', 'Pateros Post Office', 'Administrative', 'IT Concerns - Software', '3', 'inprogress', 'Jeydi Snow', '2026-03-29 21:55:39', NULL, '2026-03-25 03:22:13', '2026-03-30 07:10:12', 'testtesttest', 'TK933790', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `displayName` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'user',
  `department` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `contactNumber` varchar(50) DEFAULT NULL,
  `isVerified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `displayName`, `email`, `password`, `role`, `department`, `status`, `contactNumber`, `isVerified`, `created_at`) VALUES
(1, NULL, NULL, 'Super Administrator', 'admin@example.com', '$2a$10$vlKjvOoWDn5me1oM81T.COZe886dkuaIn7j3Gn4Zy99PIyIlJ6UWu', 'super_admin', NULL, 'active', NULL, 1, '2026-03-17 03:01:23'),
(2, NULL, NULL, 'Restricted Admin', 'restricted@example.com', '$2a$10$T8ronICH/n1wAduL.D6vX.FoETqLvri3dOd87voASYxn4m2MXc3Uq', 'admin', 'MIS', 'active', NULL, 1, '2026-03-17 03:01:23'),
(3, 'John', 'Smith', 'John Smith', 'john.smith@postoffice.com', '$2a$10$.wNxV6UE5ID.5YxozH8eBO0ESz92DK1bzuZlq8o9HRLc1xfCtKGmy', 'admin', 'Accounting', 'active', '1234567890', 1, '2026-03-17 03:01:23'),
(4, 'Sarah', 'Johnson', 'Sarah Johnson', 'sarah.johnson@postoffice.com', '$2a$10$bB2KWvXoXLpt7.9MYtNJQejmGz/93PURLSlwdTGgNPmPdsq.kO84a', 'staff', 'Accounting', 'active', '1234567891', 1, '2026-03-17 03:01:23'),
(5, 'Michael', 'Brown', 'Michael Brown', 'michael.brown@postoffice.com', '$2a$10$bSagte9qOIVoXtlIxGXpeeW4XmAYQIiInpAfJmRGYK8E9N13tIau2', 'staff', NULL, 'active', '1234567892', 1, '2026-03-17 03:01:23'),
(6, 'Emily', 'Davis', 'Emily Davis', 'emily.davis@postoffice.com', '$2a$10$FqZCntxQCrd5qeBrV6hIduCnhb.2i15RQSqcoBddRWvxwEfZ71b.2', 'staff', NULL, 'active', '1234567893', 1, '2026-03-17 03:01:23'),
(7, 'David', 'Wilson', 'David Wilson', 'david.wilson@postoffice.com', '$2a$10$3szvjjsfP8JKrtIi9H9HU.qK3pei.AyUCUi5l1sWo5tXthvHMoC7W', 'staff', NULL, 'active', '1234567894', 1, '2026-03-17 03:01:23'),
(8, 'Swabe', 'Edrian', 'Swabe Edrian', 'edrian@gmail.com', '$2a$10$gWcLK7I4Z5xALA65TK7we.Va.0SE266CZdHY5o9vVRLRdSBFvOStG', 'staff', 'MIS', 'active', '09987654321', 1, '2026-03-17 05:02:41'),
(9, NULL, NULL, '', 'gutierrezdave61@gmail.com', '$2a$10$MzTrOEQcLQC0OQXT.Bc3CuXBH8eGVsNqcrD4d5zTbKXgizqUwurZu', 'user', NULL, 'active', NULL, 1, '2026-03-17 05:04:31'),
(10, 'Jeydi', 'Snow', 'Jeydi Snow', 'jeydi@postoffice.com', '$2a$10$VbPkaUqaztj5IKze7lG8je5L/Aic.kBE5yqEbgqUl0/OsjYIeVppe', 'staff', 'MIS', 'active', '09152340819', 1, '2026-03-30 05:53:56');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `auditlog`
--
ALTER TABLE `auditlog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `joborders`
--
ALTER TABLE `joborders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `staffId` (`staffId`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticketId` (`ticketId`),
  ADD KEY `staffId` (`staffId`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userId` (`userId`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ticket_number` (`ticket_number`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `auditlog`
--
ALTER TABLE `auditlog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=108;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `joborders`
--
ALTER TABLE `joborders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=209;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `auditlog`
--
ALTER TABLE `auditlog`
  ADD CONSTRAINT `auditlog_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

--
-- Constraints for table `joborders`
--
ALTER TABLE `joborders`
  ADD CONSTRAINT `joborders_ibfk_1` FOREIGN KEY (`staffId`) REFERENCES `staff` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`ticketId`) REFERENCES `tickets` (`id`),
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`staffId`) REFERENCES `staff` (`id`);

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
