import { useState, useEffect } from "react";
import Cookies from "js-cookie";

// Cookie の保存フック
export const useCookieState = (key: string, initialValue = null) => {
  const [value, setValue] = useState(() => {
    if (typeof window !== "undefined") {
      const storedValue = Cookies.get(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    }
    return initialValue;
  });

  const setCookieValue = (
    newValue: number | ((value: number) => void),
    options = {}
  ) => {
    const valueToStore =
      typeof newValue === "function" ? newValue(value) : newValue;

    setValue(valueToStore);
    Cookies.set(key, JSON.stringify(valueToStore), {
      path: "/",
      ...options,
    });
  };

  const removeCookie = () => {
    setValue(null);
    Cookies.remove(key);
  };

  return [value, setCookieValue, removeCookie];
};

// サーバーサイドでのCookie取得フック
export const useServerCookie = (key: string) => {
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cookieValue = Cookies.get(key);
      setValue(cookieValue ? JSON.parse(cookieValue) : null);
    }
  }, [key]);

  return value;
};
