import AppDataSource from "@src/datasource";
import { MetricsEntity } from "@src/entities/metrics.entity";

export class MetricsService {
  private readonly metricsRepository =
    AppDataSource.getRepository(MetricsEntity);

  async getMetrics(userId: string): Promise<MetricsEntity> {
    return this.metricsRepository.findOne({
      where: { user: { id: userId } },
    });
  }

  async incrementMetric(userId: string, field: keyof MetricsEntity) {
    const metrics = await this.metricsRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!metrics) {
      const newMetric = this.metricsRepository.create({
        user: { id: userId } as any,
        [field]: 1,
      });
      await this.metricsRepository.save(newMetric);
    } else {
      await this.metricsRepository.increment(
        { user: { id: userId } },
        field,
        1,
      );
    }
  }

  async decrementMetric(userId: string, field: keyof MetricsEntity) {
    const metrics = await this.metricsRepository.findOne({
      where: { user: { id: userId } },
    });

    if (
      metrics &&
      typeof metrics[field] === "number" &&
      (metrics[field] as number) > 0
    ) {
      await this.metricsRepository.decrement(
        { user: { id: userId } },
        field,
        1,
      );
    }
  }
}
