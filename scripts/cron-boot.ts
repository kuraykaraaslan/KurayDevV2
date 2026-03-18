import CronService from '../services/CronService'

async function main() {
  await CronService.boot()
}

main().catch((err) => {
  console.error('Boot error:', err)
  process.exit(1)
}).finally(() => {
  console.log('Boot process completed')
  process.exit(0)
})