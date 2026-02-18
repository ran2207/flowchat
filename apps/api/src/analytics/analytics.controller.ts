import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../common/decorators/current-user.decorator'
import { AnalyticsService } from './analytics.service'

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get overview analytics stats' })
  getOverview(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getOverview(user.tenantId)
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get messages time series data' })
  getMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getMessageTimeSeries(
      user.tenantId,
      days ? Number(days) : 30,
    )
  }

  @Get('contacts/growth')
  @ApiOperation({ summary: 'Get contact growth time series' })
  getContactGrowth(
    @CurrentUser() user: CurrentUserPayload,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getContactGrowth(
      user.tenantId,
      days ? Number(days) : 30,
    )
  }

  @Get('channels')
  @ApiOperation({ summary: 'Get per-channel analytics' })
  getChannelStats(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getChannelStats(user.tenantId)
  }

  @Get('flows')
  @ApiOperation({ summary: 'Get flow performance stats' })
  getFlowStats(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getFlowStats(user.tenantId)
  }

  @Get('agents')
  @ApiOperation({ summary: 'Get agent performance stats' })
  getAgentStats(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getAgentStats(user.tenantId)
  }
}
