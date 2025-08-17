const mongoose = require("mongoose");
  const bcrypt = require("bcryptjs");

  const userSchema = new mongoose.Schema(
    {
      name: { type: String, trim: true },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      password: { type: String, required: true },
      loginToken: String,
      resetPasswordToken: String,
      resetPasswordExpires: Date,
    },
    { timestamps: true }
  );

  // Helper: detect if a string already looks like a bcrypt hash
  function isBcryptHash(pwd) {
    return typeof pwd === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(pwd);
  }

  // Optional debug logger (enable by setting DEBUG_PASSWORD_HASH=1)
  function dbg(...args) {
    if (process.env.DEBUG_PASSWORD_HASH === "1") {
      // Do NOT log actual passwords
      console.log("[userModel]", ...args);
    }
  }

  // Hash password automatically when it changes on save/create
  userSchema.pre("save", async function (next) {
  try {
    if (!isBcryptHash(this.password)) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(String(this.password), salt);
      dbg("pre(save): hashed password for", this.email);
    }
    next();
  } catch (err) {
    next(err);
  }
});

  // Also hash password when using update operations that bypass 'save'
  async function hashPasswordInUpdate(next) {
    try {
      let update = this.getUpdate();
      if (!update) return next();

      // Case A: classic object update { $set: { password: '...' } } or { password: '...' }
      if (!Array.isArray(update)) {
        const $set = update.$set || {};
        const candidate =
          (typeof $set.password !== "undefined" ? $set.password : undefined) ??
          (typeof update.password !== "undefined" ? update.password : undefined);

        if (!candidate) return next();

        const pwd = String(candidate || "");
        if (!isBcryptHash(pwd)) {
          const salt = await bcrypt.genSalt(10);
          const hashed = await bcrypt.hash(pwd, salt);
          if (typeof $set.password !== "undefined") {
            $set.password = hashed;
            update.$set = $set;
          } else if (typeof update.password !== "undefined") {
            update.password = hashed;
          }
          this.setUpdate(update);
          dbg("pre(update*): hashed password in object update");
        }
        return next();
      }

      // Case B: aggregation pipeline update (array)
      // Example: [{ $set: { password: "plain" } }]
      const pipeline = update;
      let modified = false;
      for (const stage of pipeline) {
        if (stage && stage.$set && typeof stage.$set.password === "string") {
          const pwd = stage.$set.password;
          if (!isBcryptHash(pwd)) {
            const salt = await bcrypt.genSalt(10);
            stage.$set.password = await bcrypt.hash(String(pwd), salt);
            modified = true;
          }
        }
      }
      if (modified) {
        this.setUpdate(pipeline);
        dbg("pre(update*): hashed password in aggregation pipeline update");
      }
      next();
    } catch (err) {
      next(err);
    }
  }

  userSchema.pre("findOneAndUpdate", hashPasswordInUpdate);
  userSchema.pre("findByIdAndUpdate", hashPasswordInUpdate);
  userSchema.pre("updateOne", hashPasswordInUpdate);
  userSchema.pre("update", hashPasswordInUpdate);
  userSchema.pre("updateMany", hashPasswordInUpdate);

  // Helper used by login
  userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  // Hide sensitive fields when sending to clients
  if (!userSchema.options.toJSON) userSchema.options.toJSON = {};
  userSchema.options.toJSON.transform = function (doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  };

  module.exports = mongoose.models.User || mongoose.model("User", userSchema);