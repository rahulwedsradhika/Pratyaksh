import { studentFetch } from '../services/studentFetch';
import { useAuth } from './AuthContext';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { user: authenticatedUser } = useAuth();
  const bookmarkOwner = authenticatedUser?.id || authenticatedUser?._id || '';
  const ownerRef = useRef(bookmarkOwner);
  ownerRef.current = bookmarkOwner;
  const bookmarkPending = useRef(new Set());
  // Local Learner Profile
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ayur_local_learner');
    return saved ? JSON.parse(saved) : {
      id: 'local-learner',
      name: 'Local Learner',
      role: 'AIAPGET & BAMS Scholar',
      email: 'learner@pratyakshayurveda.local',
      phone: '+91 8795776006',
      avatar: '/assets/website-assets/img/icon/icons8-male-user-96.png'
    };
  });

  // Cart State
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // Bookmarked Questions
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [bookmarksError, setBookmarksError] = useState('');
  useEffect(() => {
    let active = true;
    setBookmarks([]);
    setBookmarksError('');
    if (!bookmarkOwner) { setBookmarksLoading(false); return; }
    setBookmarksLoading(true);
    studentFetch('/api/student/bookmarks', { cache: 'no-store' }).then(async response => {
      const body = await response.json();
      if (!response.ok || !body.status) throw new Error('Unable to load saved questions. Refresh to try again.');
      if (active) setBookmarks(body.data);
    }).catch(error => { if (active) setBookmarksError(error.message); })
      .finally(() => { if (active) setBookmarksLoading(false); });
    return () => { active = false; };
  }, [bookmarkOwner]);

  // Enrolled Courses
  const [enrolledCourses, setEnrolledCourses] = useState(() => {
    const saved = localStorage.getItem('ayur_enrolled');
    return saved ? JSON.parse(saved) : ['69f30ebda08eda4f22febd85']; // Ayurdeeksha 3.0 pre-enrolled for demo!
  });

  // Toast Notification
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem('ayur_demo_user', JSON.stringify(user));
  }, [user]);


  useEffect(() => {
    localStorage.setItem('ayur_enrolled', JSON.stringify(enrolledCourses));
  }, [enrolledCourses]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.status) {
        setCart(data.data.items || []);
        setCartCount(data.data.totalCount || 0);
      }
    } catch (e) {
      console.warn('Failed to fetch cart:', e);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (course) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course._id || course.id })
      });
      const data = await res.json();
      if (data.status) {
        showToast(`"${course.name}" added to bag!`, 'success');
        fetchCart();
      } else {
        showToast(data.message || 'Failed to add', 'error');
      }
    } catch (e) {
      showToast('Error adding to cart', 'error');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status) {
        showToast('Item removed from bag', 'info');
        fetchCart();
      }
    } catch (e) {
      showToast('Error removing item', 'error');
    }
  };

  const enrollCourse = (courseId) => {
    if (!enrolledCourses.includes(courseId)) {
      setEnrolledCourses(prev => [...prev, courseId]);
      showToast('Enrolled successfully in course!', 'success');
    }
  };

  const toggleBookmark = async question => {
    const id = question._id || question.id;
    if (!id || !bookmarkOwner || bookmarksLoading || bookmarksError || bookmarkPending.current.has(id)) {
      showToast(bookmarksError || 'Saved questions are still loading. Please try again.', 'error');
      return;
    }
    const owner = bookmarkOwner;
    bookmarkPending.current.add(id);
    const exists = bookmarks.some(item => item.id === id);
    try {
      const response = await studentFetch(exists ? `/api/student/bookmarks/${encodeURIComponent(id)}` : '/api/student/bookmarks', {
        method: exists ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(exists ? {} : { body: JSON.stringify({ ...question, id, _id: id }) })
      });
      const body = await response.json();
      if (!response.ok || !body.status) throw new Error('Could not save your change. Please try again.');
      if (ownerRef.current !== owner) return;
      setBookmarks(previous => exists ? previous.filter(item => item.id !== id) : [body.data, ...previous.filter(item => item.id !== id)]);
      showToast(exists ? 'Question removed from saved questions.' : 'Question saved!', 'success');
    } catch (error) { if (ownerRef.current === owner) showToast(error.message, 'error'); }
    finally { bookmarkPending.current.delete(id); }
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      cart,
      cartCount,
      fetchCart,
      addToCart,
      removeFromCart,
      enrolledCourses,
      enrollCourse,
      bookmarks,
      bookmarksLoading,
      bookmarksError,
      toggleBookmark,
      toast,
      showToast
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

