function getCurrentOnCallIndex(schedule) {
  const { rotationType, startDate, rotationMembers } = schedule;

  if (!rotationMembers || rotationMembers.length === 0) return null;

  const now = Date.now();
  const start = new Date(startDate).getTime();

  if (now < start) return 0;

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysElapsed = Math.floor((now - start) / msPerDay);

  const rotationLengthInDays = rotationType === "weekly" ? 7 : 1;
  const rotationsElapsed = Math.floor(daysElapsed / rotationLengthInDays);

  return rotationsElapsed % rotationMembers.length;
}

function getCurrentOnCallUserId(schedule) {
  const index = getCurrentOnCallIndex(schedule);
  if (index === null) return null;
  return schedule.rotationMembers[index];
}

module.exports = { getCurrentOnCallIndex, getCurrentOnCallUserId };