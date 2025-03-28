import styles from './LogoSwitch.module.css';
import ThemeToggle from './Theme_Toggle';
import Image from 'next/image';
import Link from 'next/link';

const LogoSwitch = () => {
  return (
    <div className={styles.container}>
      <Link href={"https://hcmut.edu.vn/"}>
        <Image src="/logo.webp" height={100} width={100} alt="logo" style={{width: '100%', height: 'auto'}} priority/>
      </Link>
      <ThemeToggle/>
    </div>
  );
};

export default LogoSwitch;