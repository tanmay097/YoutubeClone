import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const VideoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 5000 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    thumbnailUrl: { type: String, required: true },
    views: { type: Number, default: 0, min: 0 },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);
VideoSchema.index({ createdAt: -1, _id: -1 });

export const Video: Model<InferSchemaType<typeof VideoSchema>> = models.Video || model("Video", VideoSchema);
