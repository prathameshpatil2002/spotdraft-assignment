import { z } from 'zod';

export const ShareCreateSchema = z.object({
    feed_id: z.number(),
    expires_in_days: z.number().optional(),
});

export const ShareResponseSchema = z.object({
    share_token: z.string(),
    share_url: z.string(),
    expires_at: z.string().optional(),
});

export const InvitedCommentCreateSchema = z.object({
    commenter_name: z.string(),
    comment_body: z.string(),
});

export const InvitedCommentResponseSchema = z.object({
    id: z.number(),
    commenter_name: z.string(),
    comment_body: z.string(),
    created_at: z.string(),
});

export type ShareCreate = z.infer<typeof ShareCreateSchema>;
export type ShareResponse = z.infer<typeof ShareResponseSchema>;
export type InvitedCommentCreate = z.infer<typeof InvitedCommentCreateSchema>;
export type InvitedCommentResponse = z.infer<typeof InvitedCommentResponseSchema>; 