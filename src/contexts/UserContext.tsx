import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
  brokerLogo: string | null;
  setBrokerLogo: (logo: string | null) => void;
  isHydrated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userName, setUserNameState] = useState('Admin');
  const [userEmail, setUserEmailState] = useState('admin@koter.app');
  const [profileImage, setProfileImageState] = useState<string | null>(null);
  const [brokerLogo, setBrokerLogoState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const STORAGE_KEY_NAME = 'koter.userName';
  const STORAGE_KEY_EMAIL = 'koter.userEmail';
  const STORAGE_KEY_IMAGE = 'koter.profileImage';
  const STORAGE_KEY_BROKER_LOGO = 'koter.brokerLogo';

  useEffect(() => {
    (async () => {
      try {
        const savedName = await AsyncStorage.getItem(STORAGE_KEY_NAME);
        const savedEmail = await AsyncStorage.getItem(STORAGE_KEY_EMAIL);
        const savedImage = await AsyncStorage.getItem(STORAGE_KEY_IMAGE);
        const savedBrokerLogo = await AsyncStorage.getItem(STORAGE_KEY_BROKER_LOGO);

        if (savedName) setUserNameState(savedName);
        if (savedEmail) setUserEmailState(savedEmail);
        if (savedImage) setProfileImageState(savedImage);
        if (savedBrokerLogo) setBrokerLogoState(savedBrokerLogo);
      } catch {
        // ignora erros de storage
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  const setUserName = (name: string) => {
    setUserNameState(name);
    AsyncStorage.setItem(STORAGE_KEY_NAME, name).catch(() => {});
  };

  const setUserEmail = (email: string) => {
    setUserEmailState(email);
    AsyncStorage.setItem(STORAGE_KEY_EMAIL, email).catch(() => {});
  };

  const setProfileImage = (image: string | null) => {
    setProfileImageState(image);
    if (image) {
      AsyncStorage.setItem(STORAGE_KEY_IMAGE, image).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_IMAGE).catch(() => {});
    }
  };

  const setBrokerLogo = (logo: string | null) => {
    setBrokerLogoState(logo);
    if (logo) {
      AsyncStorage.setItem(STORAGE_KEY_BROKER_LOGO, logo).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_BROKER_LOGO).catch(() => {});
    }
  };

  return (
    <UserContext.Provider
      value={{
        userName,
        setUserName,
        userEmail,
        setUserEmail,
        profileImage,
        setProfileImage,
        brokerLogo,
        setBrokerLogo,
        isHydrated,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};


