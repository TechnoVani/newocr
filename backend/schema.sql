-- XAMPP-Lite
-- version 8.5.5
-- https://xampplite.sf.net/
--
-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 15, 2026 at 09:08 AM
-- Server version: 11.4.10-MariaDB-log
-- PHP Version: 8.5.5

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `notion`
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
-- Table structure for table `policies`
--

CREATE TABLE `policies` (
  `id` int(11) NOT NULL,
  `bqp` int(11) UNSIGNED DEFAULT NULL,
  `reporting_manager` int(11) UNSIGNED DEFAULT NULL,
  `relationship_manager` int(11) UNSIGNED DEFAULT NULL,
  `pos_id` int(50) UNSIGNED DEFAULT NULL,
  `ref_id` int(50) UNSIGNED DEFAULT NULL,
  `business_type` varchar(50) DEFAULT NULL,
  `insurance_company` varchar(150) DEFAULT NULL,
  `policy_number` varchar(100) NOT NULL,
  `policy_type` varchar(100) DEFAULT NULL,
  `vehicle_category` varchar(100) DEFAULT NULL,
  `office_name` varchar(255) DEFAULT NULL,
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
  `manufacturing_year` int(11) DEFAULT NULL,
  `commercial_vehicle_type` varchar(100) DEFAULT NULL,
  `chassis_number` varchar(150) DEFAULT NULL,
  `sub_type` varchar(100) DEFAULT NULL,
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
  ADD PRIMARY KEY (`id`);

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
  ADD KEY `pos_code` (`pos_code`);

--
-- Indexes for table `employee_references`
--
ALTER TABLE `employee_references`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ref_mobile` (`ref_mobile`);

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
  ADD KEY `insurance_company_created_by` (`created_by`);

--
-- Indexes for table `our_branch`
--
ALTER TABLE `our_branch`
  ADD PRIMARY KEY (`id`),
  ADD KEY `our_branch_created_by` (`created_by`);

--
-- Indexes for table `policies`
--
ALTER TABLE `policies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `policy_number` (`policy_number`),
  ADD KEY `policy_bqp` (`bqp`),
  ADD KEY `policy_reporting_manager` (`reporting_manager`),
  ADD KEY `policy_relationship_manager` (`relationship_manager`),
  ADD KEY `policy_pos_id` (`pos_id`),
  ADD KEY `policy_ref_id` (`ref_id`),
  ADD KEY `policy_created_by` (`created_by`);

--
-- Indexes for table `set_count`
--
ALTER TABLE `set_count`
  ADD PRIMARY KEY (`id`);

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
-- AUTO_INCREMENT for table `policies`
--
ALTER TABLE `policies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `set_count`
--
ALTER TABLE `set_count`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `account_details`
--
ALTER TABLE `account_details`
  ADD CONSTRAINT `fk_account_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_account_pos` FOREIGN KEY (`pos_id`) REFERENCES `employee_pos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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

--
-- Constraints for table `employee_pos`
--
ALTER TABLE `employee_pos`
  ADD CONSTRAINT `bqp` FOREIGN KEY (`bqp`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `employee_pos_refer_by` FOREIGN KEY (`refer_by`) REFERENCES `employees` (`employee_code`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employee_pos_refer_by` FOREIGN KEY (`refer_by`) REFERENCES `employees` (`employee_code`) ON UPDATE CASCADE,
  ADD CONSTRAINT `pos_relationship_manager` FOREIGN KEY (`relationship_manager`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `pos_reporting_branch` FOREIGN KEY (`reporting_branch`) REFERENCES `our_branch` (`id`),
  ADD CONSTRAINT `pos_reporting_manager` FOREIGN KEY (`reporting_manager`) REFERENCES `employees` (`id`);

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
-- Constraints for table `policies`
--
ALTER TABLE `policies`
  ADD CONSTRAINT `policies_bqp` FOREIGN KEY (`bqp`) REFERENCES `employees` (`bqp`),
  ADD CONSTRAINT `policy_bqp` FOREIGN KEY (`bqp`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `policy_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `policy_pos_id` FOREIGN KEY (`pos_id`) REFERENCES `employee_pos` (`id`),
  ADD CONSTRAINT `policy_ref_id` FOREIGN KEY (`ref_id`) REFERENCES `employee_references` (`id`),
  ADD CONSTRAINT `policy_relationship_manager` FOREIGN KEY (`relationship_manager`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `policy_reporting_manager` FOREIGN KEY (`reporting_manager`) REFERENCES `employees` (`id`);
COMMIT;
