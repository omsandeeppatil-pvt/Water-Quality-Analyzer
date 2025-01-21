// pages/choice.tsx (Choice Page)
import React from "react";
import Link from "next/link";
import { FaUpload, FaMapMarkedAlt } from "react-icons/fa"; // Import icons
import styles from "@/app/styles/choice.module.css";

const ChoicePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Choose Your Analysis Method</h1>
      <div className={styles.sections}>
        {/* Upload and Analyze Section */}
        <div className={styles.card}>
          <FaUpload className={styles.icon} /> {/* Icon for upload */}
          <h2 className={styles.cardTitle}>Upload Image</h2>
          <p className={styles.cardDescription}>
            Upload an image of your water sample and get a detailed analysis instantly.
          </p>
          <Link href="/upload" className={styles.actionButton}>
            Upload & Analyze
          </Link>
        </div>

        {/* Choose from Map Section */}
        <div className={styles.card}>
          <FaMapMarkedAlt className={styles.icon} /> {/* Icon for map */}
          <h2 className={styles.cardTitle}>Choose from Map</h2>
          <p className={styles.cardDescription}>
            Select a location on the map to analyze water quality data for that area.
          </p>
          <Link href="/map" className={styles.actionButton}>
            View Map
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ChoicePage;
