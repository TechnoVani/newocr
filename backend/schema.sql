-- XAMPP-Lite
-- version 8.5.5
-- https://xampplite.sf.net/
--
-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: configured through DB_HOST in backend/.env
-- Generation Time: Jul 15, 2026 at 09:08 AM
-- Server version: 11.4.10-MariaDB-log
-- PHP Version: 8.5.5

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS=0;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `notion_ops`
--

-- --------------------------------------------------------

--
-- Table structure for table `account_details`
--

CREATE TABLE `account_details` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED DEFAULT NULL,
  `pos_id` int(10) UNSIGNED DEFAULT NULL,
  `account_holder_name` varchar(255) NOT NULL,
  `bank_name` varchar(255) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `ifsc_code` varchar(20) NOT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `account_type` varchar(50) DEFAULT NULL,
  `updated_by` int(11) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(10) UNSIGNED NOT NULL,
  `department_name` varchar(100) NOT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `department_name`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Sales', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(2, 'POS Management', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(3, 'Operations', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(4, 'Underwriting', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(5, 'Claims', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(6, 'Customer Support', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(7, 'Renewal', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(8, 'Finance', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(9, 'Accounts', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(10, 'Human Resources (HR)', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(11, 'Administration', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(12, 'Information Technology (IT)', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(13, 'Marketing', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(14, 'Compliance', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(15, 'Legal', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(16, 'Training', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(17, 'Business Development', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(18, 'Audit', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(19, 'Risk Management', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34'),
(20, 'CRM (Customer Relationship Management)', 1, '2026-07-10 05:37:34', '2026-07-10 05:37:34');

-- --------------------------------------------------------

--
-- Table structure for table `designations`
--

CREATE TABLE `designations` (
  `id` int(10) UNSIGNED NOT NULL,
  `department` int(10) UNSIGNED NOT NULL,
  `designation_name` varchar(100) NOT NULL,
  `parent_designation_id` int(10) UNSIGNED DEFAULT NULL,
  `hierarchy_level` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `designations`
--

INSERT INTO `designations` (`id`, `department`, `designation_name`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 'Sales Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(2, 1, 'Sales Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(3, 1, 'Regional Sales Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(4, 2, 'POS Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(5, 2, 'POS Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(6, 3, 'Operations Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(7, 3, 'Operations Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(8, 4, 'Underwriter', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(9, 4, 'Senior Underwriter', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(10, 5, 'Claims Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(11, 5, 'Claims Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(12, 6, 'Customer Support Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(13, 6, 'Support Team Leader', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(14, 7, 'Renewal Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(15, 8, 'Finance Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(16, 8, 'Finance Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(17, 9, 'Accountant', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(18, 9, 'Senior Accountant', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(19, 10, 'HR Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(20, 10, 'HR Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(21, 11, 'Admin Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(22, 11, 'Admin Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(23, 12, 'Software Developer', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(24, 12, 'System Administrator', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(25, 12, 'Network Engineer', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(26, 13, 'Marketing Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(27, 13, 'Marketing Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(28, 14, 'Compliance Officer', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(29, 15, 'Legal Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(30, 15, 'Legal Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(31, 16, 'Training Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(32, 17, 'Business Development Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(33, 17, 'Business Development Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(34, 18, 'Internal Auditor', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(35, 19, 'Risk Analyst', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(36, 19, 'Risk Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(37, 20, 'CRM Executive', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51'),
(38, 20, 'CRM Manager', 1, '2026-07-10 05:40:51', '2026-07-10 05:40:51');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_code` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `personal_email` varchar(255) DEFAULT NULL,
  `aadhaar_number` varchar(20) DEFAULT NULL,
  `pan_number` varchar(20) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `emergency_contact` varchar(20) DEFAULT NULL,
  `current_address` text DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `pin_code` varchar(10) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `user_login` varchar(50) DEFAULT NULL,
  `user_type` varchar(50) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `is_bqp` enum('Yes','No') NOT NULL DEFAULT 'No',
  `document_status` varchar(50) DEFAULT NULL,
  `designation` int(11) UNSIGNED DEFAULT NULL,
  `department` int(11) UNSIGNED DEFAULT NULL,
  `bqp` int(11) UNSIGNED DEFAULT 3,
  `reporting_manager` int(11) UNSIGNED DEFAULT 3,
  `relationship_manager` int(11) UNSIGNED DEFAULT NULL,
  `reporting_branch` int(11) UNSIGNED DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `relieving_date` date DEFAULT NULL,
  `father_name` varchar(255) DEFAULT NULL,
  `father_occupation` varchar(255) DEFAULT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `marital_status` varchar(20) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  `year_of_passing` smallint(6) DEFAULT NULL,
  `created_by` int(11) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `employee_pos`
--

CREATE TABLE `employee_pos` (
  `id` int(10) UNSIGNED NOT NULL,
  `pos_code` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `aadhaar_number` varchar(20) DEFAULT NULL,
  `pan_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `verification` enum('Verify','Unverify') DEFAULT 'Unverify',
  `pan_verification` enum('Verify','Unverify') DEFAULT 'Unverify',
  `document_status` enum('verify','Unverify') DEFAULT 'Unverify',
  `veri` enum('Yes','No') DEFAULT 'No',
  `bqp` int(11) UNSIGNED DEFAULT 3,
  `reporting_manager` int(11) UNSIGNED NOT NULL DEFAULT 3,
  `relationship_manager` int(11) UNSIGNED NOT NULL DEFAULT 3,
  `reporting_branch` int(11) UNSIGNED NOT NULL DEFAULT 1,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  `year_of_passing` int(11) DEFAULT NULL,
  `board_name` varchar(255) DEFAULT NULL,
  `father_name` varchar(255) DEFAULT NULL,
  `current_address` text DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `pin_code` varchar(10) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `valid_upto` date DEFAULT NULL,
  `relieving_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `refer_by` int(11) UNSIGNED NOT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_references`
--

CREATE TABLE `employee_references` (
  `id` int(10) UNSIGNED NOT NULL,
  `bqp_id` int(11) UNSIGNED NOT NULL,
  `reporting_id` int(11) UNSIGNED NOT NULL,
  `relationship_id` int(11) UNSIGNED NOT NULL,
  `pos_id` int(10) UNSIGNED NOT NULL,
  `ref_name` varchar(255) NOT NULL,
  `ref_mobile` varchar(20) DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `insurance_branch`
--

CREATE TABLE `insurance_branch` (
  `id` int(10) UNSIGNED NOT NULL,
  `gst_no` varchar(30) DEFAULT NULL,
  `insurer` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `pin_code` varchar(20) DEFAULT NULL,
  `contact` varchar(50) DEFAULT NULL,
  `support_email` varchar(100) DEFAULT NULL,
  `brockercode` varchar(100) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `insurance_branch`
--

-- --------------------------------------------------------

--
-- Table structure for table `insurance_company`
--

CREATE TABLE `insurance_company` (
  `id` int(10) UNSIGNED NOT NULL,
  `insurer` varchar(255) DEFAULT NULL,
  `link` text DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `insurance_company`
--

-- --------------------------------------------------------

--
-- Table structure for table `our_branch`
--

CREATE TABLE `our_branch` (
  `id` int(10) UNSIGNED NOT NULL,
  `branch_name` varchar(100) DEFAULT NULL,
  `gst_no` varchar(30) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `pin_code` varchar(20) DEFAULT NULL,
  `contact_number` varchar(50) DEFAULT NULL,
  `support_email` varchar(100) DEFAULT NULL,
  `broker_code` varchar(100) DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `our_branch`
--

-- --------------------------------------------------------

--
-- Table structure for table `policies_motor`
--

CREATE TABLE `policies_motor` (
  `id` int(11) NOT NULL,
  `bqp` int(11) UNSIGNED DEFAULT NULL,
  `reporting_manager` int(11) UNSIGNED DEFAULT NULL,
  `relationship_manager` int(11) UNSIGNED DEFAULT NULL,
  `pos_id` int(50) UNSIGNED DEFAULT NULL,
  `ref_id` int(50) UNSIGNED DEFAULT NULL,
  `business_type` varchar(50) DEFAULT NULL,
  `insurance_company` varchar(150) DEFAULT NULL,
  `policy_number` varchar(100) NOT NULL,
  `product_type` varchar(100) DEFAULT NULL,
  `categories` varchar(100) DEFAULT NULL,
  `insurer_branch` varchar(255) DEFAULT NULL,
  `insured_name` varchar(150) DEFAULT NULL,
  `pan` varchar(20) DEFAULT NULL,
  `gstin` varchar(30) DEFAULT NULL,
  `contact` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `od_expiry` date DEFAULT NULL,
  `tp_expiry` date DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `idv` decimal(15,2) DEFAULT NULL,
  `previous_insurer` varchar(150) DEFAULT NULL,
  `previous_policy` varchar(100) DEFAULT NULL,
  `first_year_od` decimal(15,2) DEFAULT NULL,
  `first_year_tp` decimal(15,2) DEFAULT NULL,
  `total_od` decimal(15,2) DEFAULT NULL,
  `total_tp` decimal(15,2) DEFAULT NULL,
  `net_premium` decimal(15,2) DEFAULT NULL,
  `gst` decimal(15,2) DEFAULT NULL,
  `total_payable` decimal(15,2) DEFAULT NULL,
  `registration_number` varchar(50) DEFAULT NULL,
  `rto` varchar(10) DEFAULT NULL,
  `manufacturing_year` int(11) DEFAULT NULL,
  `classification` varchar(100) DEFAULT NULL,
  `ncb` varchar(30) DEFAULT NULL,
  `chassis_number` varchar(150) DEFAULT NULL,
  `engine_number` varchar(150) DEFAULT NULL,
  `fuel` varchar(50) DEFAULT NULL,
  `gvw` varchar(50) DEFAULT NULL,
  `make_name` varchar(150) DEFAULT NULL,
  `cc` varchar(50) DEFAULT NULL,
  `model_name` varchar(150) DEFAULT NULL,
  `seating_capacity` varchar(30) DEFAULT NULL,
  `variant_name` varchar(150) DEFAULT NULL,
  `financier` varchar(150) DEFAULT NULL,
  `irda_od` varchar(100) DEFAULT NULL,
  `irda_tp` varchar(100) DEFAULT NULL,
  `irda_net` varchar(100) DEFAULT NULL,
  `pos_od` varchar(100) DEFAULT NULL,
  `pos_tp` varchar(100) DEFAULT NULL,
  `pos_net` varchar(100) DEFAULT NULL,
  `verify_remark` text DEFAULT NULL,
  `account_remark` text DEFAULT NULL,
  `payment_status` varchar(50) DEFAULT NULL,
  `created_by` int(11) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `insurer_statement_rows` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `policy_number` varchar(150) NOT NULL,
  `insurance_company` varchar(255) DEFAULT NULL,
  `insured_name` varchar(150) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `total_od` decimal(15,2) DEFAULT NULL,
  `total_tp` decimal(15,2) DEFAULT NULL,
  `net_premium` decimal(15,2) DEFAULT NULL,
  `irda_od` decimal(10,2) DEFAULT NULL,
  `irda_tp` decimal(10,2) DEFAULT NULL,
  `irda_net` decimal(10,2) DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `insurer_statement_policy_number` (`policy_number`),
  KEY `insurer_statement_issue_date` (`issue_date`),
  KEY `insurer_statement_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `policies_cancelled` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `policy_id` int(11) NOT NULL,
  `policy_number` varchar(100) NOT NULL,
  `cancellation_date` date NOT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_by` int(11) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `policies_cancelled_policy_id` (`policy_id`),
  KEY `policies_cancelled_policy_number` (`policy_number`),
  KEY `policies_cancelled_date` (`cancellation_date`),
  KEY `policies_cancelled_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payout_grid_rows` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company` varchar(255) NOT NULL,
  `payout_month` char(7) NOT NULL,
  `business_type` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `classification` varchar(150) DEFAULT NULL,
  `product_type` varchar(150) DEFAULT NULL,
  `rto` varchar(255) DEFAULT NULL,
  `od_comm` decimal(10,4) DEFAULT NULL,
  `tp_comm` decimal(10,4) DEFAULT NULL,
  `net_comm` decimal(10,4) DEFAULT NULL,
  `cc` varchar(255) DEFAULT NULL,
  `fuel_type` varchar(255) DEFAULT NULL,
  `make` text DEFAULT NULL,
  `decline_make` text DEFAULT NULL,
  `model` text DEFAULT NULL,
  `decline_model` text DEFAULT NULL,
  `ncb` varchar(255) DEFAULT NULL,
  `seat` varchar(255) DEFAULT NULL,
  `gvw` varchar(255) DEFAULT NULL,
  `source_file_name` varchar(255) DEFAULT NULL,
  `source_row_number` int(10) UNSIGNED DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `payout_grid_company_month` (`company`,`payout_month`),
  KEY `payout_grid_category_classification` (`category`,`classification`),
  KEY `payout_grid_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `department_work_items` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `department_slug` varchar(80) NOT NULL,
  `policy_id` int(11) DEFAULT NULL,
  `policy_number` varchar(150) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `work_type` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('Low','Normal','High','Critical') NOT NULL DEFAULT 'Normal',
  `status` enum('Open','In Progress','Pending','Approved','Completed','Rejected') NOT NULL DEFAULT 'Open',
  `assigned_to` int(10) UNSIGNED DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `department_work_items_department` (`department_slug`,`status`),
  KEY `department_work_items_policy` (`policy_id`),
  KEY `department_work_items_assignee` (`assigned_to`),
  KEY `department_work_items_due_date` (`due_date`),
  KEY `department_work_items_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `department_work_item_history` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `work_item_id` bigint(20) UNSIGNED NOT NULL,
  `from_status` varchar(30) DEFAULT NULL,
  `to_status` varchar(30) NOT NULL,
  `note` varchar(1000) DEFAULT NULL,
  `changed_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `department_work_history_item` (`work_item_id`,`created_at`),
  KEY `department_work_history_user` (`changed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id INT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_reset_employee (employee_id),
    INDEX idx_password_reset_expiry (expires_at)
);

--
-- Indexes for table `account_details`
--
ALTER TABLE `account_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `account_employee_id` (`employee_id`),
  ADD KEY `account_pos_id` (`pos_id`),
  ADD KEY `account_updated_by` (`updated_by`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `designations`
--
ALTER TABLE `designations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employee_code` (`employee_code`),
  ADD UNIQUE KEY `personal_email` (`personal_email`),
  ADD UNIQUE KEY `aadhaar_number` (`aadhaar_number`),
  ADD UNIQUE KEY `pan_number` (`pan_number`),
  ADD UNIQUE KEY `mobile` (`mobile`),
  ADD KEY `employee_bqp` (`bqp`),
  ADD KEY `reporting_manager` (`reporting_manager`),
  ADD KEY `relationship_manager` (`relationship_manager`),
  ADD KEY `reporting_branch` (`reporting_branch`),
  ADD KEY `departments` (`department`),
  ADD KEY `designation` (`designation`),
  ADD KEY `employee_created_by` (`created_by`);

--
-- Indexes for table `employee_pos`
--
ALTER TABLE `employee_pos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employee_code` (`pos_code`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `mobile` (`mobile`),
  ADD UNIQUE KEY `aadhaar_number` (`aadhaar_number`),
  ADD UNIQUE KEY `pan_number` (`pan_number`),
  ADD KEY `bqp` (`bqp`),
  ADD KEY `pos_reporting_manager` (`reporting_manager`),
  ADD KEY `pos_relationship_manager` (`relationship_manager`),
  ADD KEY `pos_reporting_branch` (`reporting_branch`),
  ADD KEY `fk_employee_pos_refer_by` (`refer_by`),
  ADD KEY `pos_code` (`pos_code`);

--
-- Indexes for table `employee_references`
--
ALTER TABLE `employee_references`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ref_mobile` (`ref_mobile`),
  ADD KEY `ref_created_by` (`created_by`),
  ADD KEY `ref_bqp` (`bqp_id`),
  ADD KEY `ref_reporting` (`reporting_id`),
  ADD KEY `ref_pos` (`pos_id`),
  ADD KEY `ref_relationship` (`relationship_id`);

--
-- Indexes for table `insurance_branch`
--
ALTER TABLE `insurance_branch`
  ADD PRIMARY KEY (`id`),
  ADD KEY `insurance_branch_created_by` (`created_by`);

--
-- Indexes for table `insurance_company`
--
ALTER TABLE `insurance_company`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `insurance_company_insurer_unique` (`insurer`),
  ADD KEY `insurance_company_created_by` (`created_by`);

--
-- Indexes for table `our_branch`
--
ALTER TABLE `our_branch`
  ADD PRIMARY KEY (`id`),
  ADD KEY `our_branch_created_by` (`created_by`);

--
-- Indexes for table `policies_motor`
--
ALTER TABLE `policies_motor`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `policy_number` (`policy_number`),
  ADD KEY `policy_bqp` (`bqp`),
  ADD KEY `policy_reporting_manager` (`reporting_manager`),
  ADD KEY `policy_relationship_manager` (`relationship_manager`),
  ADD KEY `policy_pos_id` (`pos_id`),
  ADD KEY `policy_ref_id` (`ref_id`),
  ADD KEY `policy_created_by` (`created_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account_details`
--
ALTER TABLE `account_details`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `designations`
--
ALTER TABLE `designations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `employee_pos`
--
ALTER TABLE `employee_pos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `employee_references`
--
ALTER TABLE `employee_references`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `insurance_branch`
--
ALTER TABLE `insurance_branch`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `insurance_company`
--
ALTER TABLE `insurance_company`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `our_branch`
--
ALTER TABLE `our_branch`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `policies_motor`
--
ALTER TABLE `policies_motor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `account_details`
--
ALTER TABLE `account_details`
  ADD CONSTRAINT `fk_account_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_account_pos` FOREIGN KEY (`pos_id`) REFERENCES `employee_pos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_account_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_departments_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `designations`
--
ALTER TABLE `designations`
  ADD CONSTRAINT `fk_designation_department` FOREIGN KEY (`department`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_designations_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `departments` FOREIGN KEY (`department`) REFERENCES `departments` (`id`),
  ADD CONSTRAINT `designation` FOREIGN KEY (`designation`) REFERENCES `designations` (`id`),
  ADD CONSTRAINT `employee_bqp` FOREIGN KEY (`bqp`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `employee_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `relationship_manager` FOREIGN KEY (`relationship_manager`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `reporting_branch` FOREIGN KEY (`reporting_branch`) REFERENCES `our_branch` (`id`),
  ADD CONSTRAINT `reporting_manager` FOREIGN KEY (`reporting_manager`) REFERENCES `employees` (`id`);

-- --------------------------------------------------------
-- HR module tables. Runtime upgrades are also handled by ensureHrSchema().
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `hr_leave_types` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `annual_quota` decimal(6,2) NOT NULL DEFAULT 0,
  `paid` tinyint(1) NOT NULL DEFAULT 1,
  `carry_forward` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_by` int UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`), UNIQUE KEY `hr_leave_type_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hr_leave_requests` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int UNSIGNED NOT NULL,
  `leave_type_id` int UNSIGNED NOT NULL,
  `from_date` date NOT NULL, `to_date` date NOT NULL, `days` decimal(6,2) NOT NULL,
  `reason` varchar(1000) NOT NULL,
  `status` enum('Pending','Approved','Rejected','Cancelled') NOT NULL DEFAULT 'Pending',
  `approver_id` int UNSIGNED DEFAULT NULL, `approver_note` varchar(1000) DEFAULT NULL,
  `decided_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`), KEY `hr_leave_employee` (`employee_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hr_payroll` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int UNSIGNED NOT NULL, `payroll_month` char(7) NOT NULL,
  `basic` decimal(15,2) NOT NULL DEFAULT 0, `hra` decimal(15,2) NOT NULL DEFAULT 0,
  `allowances` decimal(15,2) NOT NULL DEFAULT 0, `bonus` decimal(15,2) NOT NULL DEFAULT 0,
  `deductions` decimal(15,2) NOT NULL DEFAULT 0, `tax` decimal(15,2) NOT NULL DEFAULT 0,
  `net_pay` decimal(15,2) NOT NULL DEFAULT 0,
  `payment_status` enum('Draft','Processed','Paid','On Hold') NOT NULL DEFAULT 'Draft',
  `payment_date` date DEFAULT NULL, `notes` varchar(1000) DEFAULT NULL,
  `created_by` int UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`), UNIQUE KEY `hr_payroll_employee_month` (`employee_id`,`payroll_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hr_increments` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, `employee_id` int UNSIGNED NOT NULL,
  `effective_date` date NOT NULL, `previous_ctc` decimal(15,2) NOT NULL DEFAULT 0,
  `revised_ctc` decimal(15,2) NOT NULL DEFAULT 0, `increment_percent` decimal(8,2) NOT NULL DEFAULT 0,
  `reason` varchar(500) DEFAULT NULL,
  `status` enum('Proposed','Approved','Effective','Rejected') NOT NULL DEFAULT 'Proposed',
  `approved_by` int UNSIGNED DEFAULT NULL, `created_by` int UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`), KEY `hr_increment_employee` (`employee_id`,`effective_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hr_documents` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, `employee_id` int UNSIGNED NOT NULL,
  `document_type` enum('Offer Letter','Appointment Letter','Confirmation Letter','Increment Letter','Experience Certificate','Relieving Letter','Termination Letter','Salary Certificate','Employment Certificate','Warning Letter','NOC','Other') NOT NULL,
  `document_number` varchar(80) NOT NULL,
  `issue_date` date NOT NULL, `effective_date` date DEFAULT NULL,
  `subject` varchar(255) NOT NULL, `body` longtext NOT NULL,
  `status` enum('Draft','Issued','Acknowledged','Revoked') NOT NULL DEFAULT 'Draft',
  `issued_by` int UNSIGNED NOT NULL, `issued_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`), UNIQUE KEY `hr_document_number` (`document_number`),
  KEY `hr_document_employee` (`employee_id`,`document_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hr_employee_events` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, `employee_id` int UNSIGNED NOT NULL,
  `event_type` enum('Onboarding','Probation','Confirmation','Transfer','Promotion','Resignation','Termination','Relieving','Retirement','Other') NOT NULL, `event_date` date NOT NULL,
  `status` enum('Planned','In Progress','Completed','Cancelled') NOT NULL DEFAULT 'Planned',
  `notes` varchar(1000) DEFAULT NULL, `document_id` bigint UNSIGNED DEFAULT NULL,
  `created_by` int UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`), KEY `hr_event_employee` (`employee_id`,`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `designations`
  ADD CONSTRAINT `fk_designation_parent` FOREIGN KEY (`parent_designation_id`) REFERENCES `designations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `hr_leave_types`
  ADD CONSTRAINT `fk_hr_leave_type_creator` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

ALTER TABLE `hr_leave_requests`
  ADD CONSTRAINT `fk_hr_leave_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_hr_leave_type` FOREIGN KEY (`leave_type_id`) REFERENCES `hr_leave_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_hr_leave_approver` FOREIGN KEY (`approver_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `hr_payroll`
  ADD CONSTRAINT `fk_hr_payroll_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_hr_payroll_creator` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

ALTER TABLE `hr_increments`
  ADD CONSTRAINT `fk_hr_increment_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_hr_increment_approver` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_hr_increment_creator` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

ALTER TABLE `hr_documents`
  ADD CONSTRAINT `fk_hr_document_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_hr_document_issuer` FOREIGN KEY (`issued_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

ALTER TABLE `hr_employee_events`
  ADD CONSTRAINT `fk_hr_event_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_hr_event_document` FOREIGN KEY (`document_id`) REFERENCES `hr_documents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_hr_event_creator` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `employee_pos`
--
ALTER TABLE `employee_pos`
  ADD CONSTRAINT `bqp` FOREIGN KEY (`bqp`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `fk_employee_pos_refer_by` FOREIGN KEY (`refer_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `pos_relationship_manager` FOREIGN KEY (`relationship_manager`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `pos_reporting_branch` FOREIGN KEY (`reporting_branch`) REFERENCES `our_branch` (`id`),
  ADD CONSTRAINT `pos_reporting_manager` FOREIGN KEY (`reporting_manager`) REFERENCES `employees` (`id`);

--
-- Constraints for table `employee_references`
--
ALTER TABLE `employee_references`
  ADD CONSTRAINT `ref_bqp` FOREIGN KEY (`bqp_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `ref_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `ref_pos` FOREIGN KEY (`pos_id`) REFERENCES `employee_pos` (`id`),
  ADD CONSTRAINT `ref_relationship` FOREIGN KEY (`relationship_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `ref_reporting` FOREIGN KEY (`reporting_id`) REFERENCES `employees` (`id`);

--
-- Constraints for table `insurance_branch`
--
ALTER TABLE `insurance_branch`
  ADD CONSTRAINT `insurance_branch_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`);

--
-- Constraints for table `insurance_company`
--
ALTER TABLE `insurance_company`
  ADD CONSTRAINT `insurance_company_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`);

--
-- Constraints for table `our_branch`
--
ALTER TABLE `our_branch`
  ADD CONSTRAINT `our_branch_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`);

--
-- Constraints for table `policies_motor`
--
ALTER TABLE `policies_motor`
  ADD CONSTRAINT `policy_bqp` FOREIGN KEY (`bqp`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `policy_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `policy_pos_id` FOREIGN KEY (`pos_id`) REFERENCES `employee_pos` (`id`),
  ADD CONSTRAINT `policy_ref_id` FOREIGN KEY (`ref_id`) REFERENCES `employee_references` (`id`),
  ADD CONSTRAINT `policy_relationship_manager` FOREIGN KEY (`relationship_manager`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `policy_reporting_manager` FOREIGN KEY (`reporting_manager`) REFERENCES `employees` (`id`);

--
-- Constraints for table `policies_cancelled`
--
ALTER TABLE `policies_cancelled`
  ADD CONSTRAINT `policies_cancelled_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `policies_cancelled_policy_fk` FOREIGN KEY (`policy_id`) REFERENCES `policies_motor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
