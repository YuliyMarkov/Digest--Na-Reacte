import { useEffect, useState } from "react";

const API_BASE_URL = "http://192.168.1.31:4000";

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        setCategoriesError("");

        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Failed to load categories");
        }

        if (isMounted) {
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);

        if (isMounted) {
          setCategoriesError("Failed to load categories");
        }
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    categories,
    categoriesLoading,
    categoriesError,
  };
}