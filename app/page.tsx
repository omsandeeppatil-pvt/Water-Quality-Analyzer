// pages/index.tsx (Landing Page)
import React from "react";
import Link from "next/link";
import styles from "@/app/styles/index.module.css";

const IndexPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <h1 className={styles.title}>Water Quality Analyzer</h1>
        <p className={styles.description}>
          Analyze and ensure the quality of your water with precision and ease. Our tool provides accurate and detailed reports to help you maintain healthy water standards for your home, business, or community.
        </p>
        <p className={styles.description}>
          With cutting-edge technology, we analyze parameters like pH, turbidity, dissolved oxygen, and more. Your trusted partner in promoting clean and safe water for everyone.
        </p>
        <Link href="/choice" className={styles.ctaButton}>
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default IndexPage;