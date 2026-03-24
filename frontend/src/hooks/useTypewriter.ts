import { useEffect, useState } from "react";

export const useTypewriter = (
  words: string[],
  speed = 70,
  deleteSpeed = 50,
  delay = 1500,
) => {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setText(currentWord.substring(0, text.length + 1));
          if (text.length === currentWord.length) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          setText(currentWord.substring(0, text.length - 1));
          if (text.length === 0) {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, speed, deleteSpeed, delay]);

  return text;
};
