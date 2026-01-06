import { db } from '@/firebase/firebase';
import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';

/**
 * Updates a user's global rating in their user profile document.
 * 
 * @param userId - The ID of the user (escorter) to update.
 * @param newRating - The rating score (1-5) to factor into the average.
 */
export const updateUserProfileRating = async (userId: string, newRating: number) => {
    console.log(`⭐ Updating profile rating for User ${userId} with score: ${newRating}`);

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.warn(`⚠️ User document for ${userId} not found. Rating not updated in profile.`);
            return;
        }

        const userData = userSnap.data();
        const currentRating = userData.rating || 0;
        const currentCount = userData.ratingCount || 0;

        // Calculate new moving average
        // (existing_avg * existing_count + new_val) / (existing_count + 1)
        const newCount = currentCount + 1;
        const newAverage = parseFloat(((currentRating * currentCount + newRating) / newCount).toFixed(2));

        await updateDoc(userRef, {
            rating: newAverage,
            ratingCount: increment(1)
        });

        console.log(`✅ User ${userId} rating updated: ${currentRating} -> ${newAverage} (Total: ${newCount})`);

    } catch (error) {
        console.error('❌ Error updating user profile rating:', error);
    }
};
