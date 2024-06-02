using System;
using Microsoft.AspNetCore.SignalR;
namespace TrialPeriodServer
{
	public class NavigationHub : Hub
	{
		public NavigationHub()
		{
		}

		public async Task MovePlayer(int x, int y, string userId)
		{
			await Clients.All.SendAsync("PlayerMoved", x, y, userId);
		}

		public async Task FindMatch(string userId)
		{
			await Clients.All.SendAsync("MatchSent", userId);
		}

		public async Task SendHealth(string userId)
		{
			await Clients.All.SendAsync("HealthSent", userId);
		}

		public async Task SendDefiningCharacteristic(string definingCharacteristic, string userId, string definingCharacteristicSelectedTimestamp)
		{
			await Clients.All.SendAsync("DefiningCharacteristicSent", definingCharacteristic, userId, definingCharacteristicSelectedTimestamp);
		}

		public async Task SendAnswer(string answer, string challengeId, string userId)
		{
			await Clients.All.SendAsync("AnswerSent", answer, challengeId, userId);
		}
	}
}

