import { cleanupAnalyticsData } from '../modules/analytics/service';
cleanupAnalyticsData().then(result => {
  console.log(JSON.stringify({ cleaned: true, ...result }));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
