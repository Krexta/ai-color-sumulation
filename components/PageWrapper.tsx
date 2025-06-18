"use client";

import { useEffect, useState } from "react";
import { Preview } from "@/components/preview";
import { useCookieState } from "@/hooks/useCookie";

interface Props {
  mode: "free" | "billing";
}

export const PageWrapper = (props: Props) => {
  const { mode } = props;

  const [cookie, setCookie] = useCookieState("count");
  const [count, setCount] = useState(0);

  const setCountValue = () => {
    // 一旦３０日の期限を入れる
    setCookie(count + 1, { expires: 30 });
    setCount(count + 1);
  };

  useEffect(() => {
    // Cookieにあるcountの値を取得する
    const count = cookie ? Number(JSON.parse(cookie)) : 0;
    setCount(count);
  }, []);

  return <Preview mode={mode} count={count} setCountValue={setCountValue} />;
};
