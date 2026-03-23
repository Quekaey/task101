'use strict';

const PROGRESS_UID = 'api::video-progress.video-progress';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = {
  async getMeProgress(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in.');
    }

    const videoId = Number(ctx.params.videoId);
    if (!videoId) {
      return ctx.badRequest('A valid videoId is required.');
    }

    const rows = await strapi.entityService.findMany(PROGRESS_UID, {
      filters: {
        user: user.id,
        video: videoId,
      },
      fields: ['watchedSeconds', 'durationSeconds', 'completionPercent', 'lastWatchedAt'],
      populate: {
        video: {
          fields: ['id', 'title'],
        },
      },
      limit: 1,
    });

    const entry = rows[0] || null;

    ctx.body = {
      data: entry,
    };
  },

  async upsertMeProgress(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in.');
    }

    const { videoId, watchedSeconds, durationSeconds } = ctx.request.body || {};

    const normalizedVideoId = Number(videoId);
    if (!normalizedVideoId) {
      return ctx.badRequest('A valid videoId is required.');
    }

    const watched = Math.max(0, toNumber(watchedSeconds, 0));
    const duration = Math.max(0, toNumber(durationSeconds, 0));
    const completion = duration > 0 ? Math.min(100, (watched / duration) * 100) : 0;

    const existing = await strapi.entityService.findMany(PROGRESS_UID, {
      filters: {
        user: user.id,
        video: normalizedVideoId,
      },
      fields: ['id'],
      limit: 1,
    });

    const payload = {
      watchedSeconds: watched,
      durationSeconds: duration || null,
      completionPercent: completion,
      lastWatchedAt: new Date().toISOString(),
      user: user.id,
      video: normalizedVideoId,
    };

    let entry;
    if (existing.length > 0) {
      entry = await strapi.entityService.update(PROGRESS_UID, existing[0].id, {
        data: payload,
        fields: ['watchedSeconds', 'durationSeconds', 'completionPercent', 'lastWatchedAt'],
        populate: {
          video: {
            fields: ['id', 'title'],
          },
        },
      });
    } else {
      entry = await strapi.entityService.create(PROGRESS_UID, {
        data: payload,
        fields: ['watchedSeconds', 'durationSeconds', 'completionPercent', 'lastWatchedAt'],
        populate: {
          video: {
            fields: ['id', 'title'],
          },
        },
      });
    }

    ctx.body = {
      data: entry,
    };
  },
};
