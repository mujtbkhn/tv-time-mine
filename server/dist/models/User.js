import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, { timestamps: true });
UserSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password)
        return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
UserSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password)
        return false;
    return await bcrypt.compare(enteredPassword, this.password);
};
export default mongoose.model('User', UserSchema);
