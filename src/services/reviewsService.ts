import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ReviewItem } from '../types';

const REVIEWS_COLLECTION = 'reviews';

export async function submitReview(
  authorUid: string,
  authorName: string,
  authorEmail: string | undefined,
  rating: number,
  comment: string,
  serviceType: 'podcast' | 'reels' | 'commercial' | 'general',
  authorProject?: string
): Promise<string> {
  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const payload: ReviewItem = {
    id: reviewId,
    authorUid,
    authorName: authorName.trim(),
    authorEmail: authorEmail?.trim(),
    authorProject: authorProject?.trim() || '',
    rating: Math.min(5, Math.max(1, rating)),
    comment: comment.trim(),
    serviceType,
    status: 'pending', // Awaits admin approval
    isFeatured: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, REVIEWS_COLLECTION, reviewId), payload);
    return reviewId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${REVIEWS_COLLECTION}/${reviewId}`);
  }
}

export function subscribeApprovedReviews(
  onData: (reviews: ReviewItem[]) => void,
  onError?: (err: unknown) => void
) {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('status', '==', 'approved')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: ReviewItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as ReviewItem);
        });
        // Sort descending by creation date
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        console.warn('Public approved reviews listener notice:', error);
      }
    );
  } catch (error) {
    if (onError) onError(error);
    return () => {};
  }
}

export function subscribeAllReviewsForAdmin(
  onData: (reviews: ReviewItem[]) => void,
  onError?: (err: unknown) => void
) {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: ReviewItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as ReviewItem);
        });
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, REVIEWS_COLLECTION);
      }
    );
  } catch (error) {
    if (onError) onError(error);
    return () => {};
  }
}

export async function updateReviewModeration(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
  isFeatured?: boolean,
  adminReply?: string
): Promise<void> {
  const path = `${REVIEWS_COLLECTION}/${id}`;
  try {
    const updates: Partial<ReviewItem> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (typeof isFeatured === 'boolean') updates.isFeatured = isFeatured;
    if (typeof adminReply === 'string') updates.adminReply = adminReply.trim();

    await updateDoc(doc(db, REVIEWS_COLLECTION, id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateReviewDetails(
  id: string,
  updates: Partial<Pick<ReviewItem, 'comment' | 'authorProject' | 'rating' | 'serviceType'>>
): Promise<void> {
  const path = `${REVIEWS_COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, REVIEWS_COLLECTION, id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReview(id: string): Promise<void> {
  const path = `${REVIEWS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
