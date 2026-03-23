'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/video-progress/me/:videoId',
      handler: 'video-progress.getMeProgress',
      config: {
        auth: true,
      },
    },
    {
      method: 'POST',
      path: '/video-progress/me',
      handler: 'video-progress.upsertMeProgress',
      config: {
        auth: true,
      },
    },
  ],
};
