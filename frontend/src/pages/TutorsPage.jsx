"use client"

import { useState } from "react"
import { useQuery } from "react-query"
import { Link } from "react-router-dom"
import { tutorsAPI, subjectsAPI } from "../services/api.js"
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card.jsx"
import Badge from "../components/Badge.jsx"
import Button from "../components/Button.jsx"
import Input from "../components/Input.jsx"
import LoadingSpinner from "../components/LoadingSpinner.jsx"
import { Star, Clock, DollarSign } from "lucide-react"
import { formatPrice } from "../lib/utils.js"

const TutorsPage = () => {
  const [filters, setFilters] = useState({
    subject: "",
    min_price: "",
    max_price: "",
    search: "",
  })

  const { data: subjects } = useQuery("subjects", subjectsAPI.getSubjects, {
    select: (response) => response.data,
  })

  const { data: tutors, isLoading } = useQuery(["tutors", filters], () => tutorsAPI.getTutors(filters), {
    select: (response) => response.data,
    keepPreviousData: true,
  })

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Найти репетитора</h1>
        <p className="text-muted-foreground">Выбе��ите подходящего репетитора для ваших занятий</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Предмет</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.subject}
                onChange={(e) => handleFilterChange("subject", e.target.value)}
              >
                <option value="">Все предметы</option>
                {subjects?.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Мин. цена</label>
              <Input
                type="number"
                placeholder="От"
                value={filters.min_price}
                onChange={(e) => handleFilterChange("min_price", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Макс. цена</label>
              <Input
                type="number"
                placeholder="До"
                value={filters.max_price}
                onChange={(e) => handleFilterChange("max_price", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Поиск</label>
              <Input
                placeholder="Имя репетитора"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutors?.map((tutor) => (
          <Card key={tutor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold">
                    {tutor.user?.first_name?.[0]}
                    {tutor.user?.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-lg">{tutor.user}</CardTitle>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{tutor.average_rating?.toFixed(1) || "5.0"}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{tutor.experience_years} лет опыта</span>
              </div>

              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{formatPrice(tutor.price_per_hour)}/час</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {tutor.subjects?.slice(0, 3).map((subject) => (
                  <Badge key={subject.id} variant="secondary">
                    {subject.name}
                  </Badge>
                ))}
                {tutor.subjects?.length > 3 && <Badge variant="outline">+{tutor.subjects.length - 3}</Badge>}
              </div>

              {tutor.description && <p className="text-sm text-muted-foreground line-clamp-3">{tutor.description}</p>}

              <div className="flex space-x-2">
                <Link to={`/tutors/${tutor.id}`} className="flex-1">
                  <Button className="w-full">Подробнее</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tutors?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Репетиторы не найдены</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TutorsPage
