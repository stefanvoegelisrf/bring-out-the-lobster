using System;
using Microsoft.AspNetCore.SignalR;
namespace TrialPeriodServer
{
	public class NavigationHub : Hub
	{
		public NavigationHub()
		{
		}

		public async Task MovePlayer(int x, int y)
		{
			await Clients.All.SendAsync("PlayerMoved", x, y);
		}

		public async Task FindMatch(string userId){
			await Clients.All.SendAsync("MatchSent", userId);
		}
	}
}

